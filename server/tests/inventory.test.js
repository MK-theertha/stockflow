import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInvoice, createProduct, loginAs, stockUp, useTestApp } from './helpers.js';

const ctx = useTestApp();

const quantityOf = async (agent, product) =>
  (await agent.get(`/api/user/productstock/${product._id}`).expect(200)).body.quantity;

describe('inventory', () => {
  it('adds stock when a purchase is approved, only once', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { purchase } = await stockUp(agent, product, 10);

    assert.equal(await quantityOf(agent, product), 10);
    await agent.put(`/api/user/purchases/${purchase._id}`).expect(400);
    assert.equal(await quantityOf(agent, product), 10);
  });

  it('deducts stock only when an invoice is approved', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category } = await stockUp(agent, product, 10);

    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 4,
      total: 400,
      status: 'full_paid',
    });
    assert.equal(await quantityOf(agent, product), 10, 'pending invoices do not touch stock');

    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(200);
    assert.equal(await quantityOf(agent, product), 6);

    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(400);
    assert.equal(await quantityOf(agent, product), 6);
  });

  it('refuses to approve an invoice without enough stock and changes nothing', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category } = await stockUp(agent, product, 2);

    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 5,
      total: 500,
      status: 'full_due',
    });
    const { body } = await agent
      .post('/api/user/invoiceapprove')
      .send({ invoiceId: invoice._id })
      .expect(400);
    assert.match(body.err, /Not enough stock/);
    assert.equal(await quantityOf(agent, product), 2);

    const { body: ledger } = await agent.get('/api/user/stock/movements').expect(200);
    assert.equal(ledger.length, 1, 'only the purchase is in the ledger');
  });

  it('records every stock change in the ledger', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category } = await stockUp(agent, product, 10);
    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 3,
      total: 300,
      status: 'full_paid',
    });
    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(200);
    await agent
      .post('/api/user/stock/adjustments')
      .send({ productId: product._id, quantity: -2, note: 'Damaged in transit' })
      .expect(201);

    const { body: ledger } = await agent
      .get(`/api/user/stock/movements?productId=${product._id}`)
      .expect(200);
    const rows = ledger.map(({ type, quantity, balance }) => ({ type, quantity, balance }));
    assert.deepEqual(rows, [
      { type: 'adjustment', quantity: -2, balance: 5 },
      { type: 'sale', quantity: -3, balance: 7 },
      { type: 'purchase', quantity: 10, balance: 10 },
    ]);
  });

  it('does not let an adjustment take stock below zero', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    await agent
      .post('/api/user/stock/adjustments')
      .send({ productId: product._id, quantity: -1, note: 'Lost' })
      .expect(400);
    await agent
      .post('/api/user/stock/adjustments')
      .send({ productId: product._id, quantity: 0, note: 'Nothing' })
      .expect(400);
  });

  it('lists products at or below their reorder level', async () => {
    const { agent } = await loginAs(ctx.app);
    const low = await createProduct(agent, { productName: 'Sugar', reorderLevel: 5 });
    const fine = await createProduct(agent, { productName: 'Salt', reorderLevel: 5 });
    await createProduct(agent, { productName: 'No alert' });
    await stockUp(agent, low, 3);
    await stockUp(agent, fine, 20);

    const { body } = await agent.get('/api/user/stock/low').expect(200);
    assert.deepEqual(
      body.map((product) => product.productName),
      ['Sugar']
    );
  });

  it('computes invoice totals on the server, ignoring totals sent by the browser', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category } = await stockUp(agent, product, 10);

    await agent
      .post('/api/user/invoice')
      .send({
        date: new Date().toISOString(),
        grandTotal: 1, // a tampered total
        discount: 50,
        status: 'full_due',
        selectedCustomer: 'new_customer',
        name: 'Walk-in',
        email: 'walkin@example.com',
        phone: 123,
        purchaseData: [
          {
            selectedProduct: product._id,
            selectedCategory: category._id,
            quantity: 3,
            unitPrice: 100,
            totalPrice: 1,
          },
        ],
      })
      .expect(201);

    const { body: payments } = await agent.get('/api/user/payment').expect(200);
    assert.equal(payments.rows[0].total_amount, 250, '3 × 100 − 50 discount');
    assert.equal(payments.rows[0].due_amount, 250);
  });

  it('reverses stock when an approved purchase is deleted', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { purchase } = await stockUp(agent, product, 10);

    await agent.delete(`/api/user/purchases/${purchase._id}`).expect(200);
    assert.equal(await quantityOf(agent, product), 0);

    const { body: ledger } = await agent.get('/api/user/stock/movements').expect(200);
    assert.deepEqual(
      ledger.map((m) => [m.type, m.quantity]),
      [
        ['reversal', -10],
        ['purchase', 10],
      ]
    );
  });

  it('refuses to delete a purchase whose stock has been sold', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category, purchase } = await stockUp(agent, product, 10);
    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 4,
      total: 400,
      status: 'full_paid',
    });
    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(200);

    const { body } = await agent.delete(`/api/user/purchases/${purchase._id}`).expect(400);
    assert.match(body.err, /already been sold/);
    assert.equal(await quantityOf(agent, product), 6);
    const { body: purchases } = await agent.get('/api/user/purchases').expect(200);
    assert.equal(purchases.total, 1, 'the purchase is kept');
  });

  it('returns stock when an approved invoice is deleted', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category } = await stockUp(agent, product, 10);
    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 4,
      total: 400,
      status: 'full_paid',
    });
    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(200);
    assert.equal(await quantityOf(agent, product), 6);

    await agent.delete(`/api/user/invoice/${invoice._id}`).expect(200);
    assert.equal(await quantityOf(agent, product), 10);
  });

  it("keeps each shop's records private", async () => {
    const { agent: shopA } = await loginAs(ctx.app);
    const { agent: shopB } = await loginAs(ctx.app);
    const product = await createProduct(shopA);

    const { body: listB } = await shopB.get('/api/user/products').expect(200);
    assert.equal(listB.length, 0);
    await shopB.get(`/api/user/productstock/${product._id}`).expect(404);
    await shopB.delete(`/api/user/products/${product._id}`).expect(404);
    await shopB
      .post('/api/user/stock/adjustments')
      .send({ productId: product._id, quantity: 5, note: 'Sneaky' })
      .expect(404);

    const { agent: admin } = await loginAs(ctx.app, { role: 'admin', subscribed: false });
    const { body: listAdmin } = await admin.get('/api/user/products').expect(200);
    assert.equal(listAdmin.length, 1);
  });
});
