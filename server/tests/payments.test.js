import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInvoice, createProduct, loginAs, stockUp, useTestApp } from './helpers.js';

const ctx = useTestApp();

async function creditSale(agent, { total, paid }) {
  const product = await createProduct(agent);
  const { category } = await stockUp(agent, product, 10);
  const invoice = await createInvoice(agent, {
    product,
    category,
    quantity: 1,
    total,
    paid,
    status: paid ? 'partial_paid' : 'full_due',
  });
  await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(200);
  const { body: payments } = await agent.get('/api/user/creditcustomer').expect(200);
  return { invoice, payment: payments.find((p) => p.invoice_id._id === invoice._id) };
}

describe('receivables', () => {
  it('collects a due amount in parts until the invoice is paid', async () => {
    const { agent } = await loginAs(ctx.app);
    const { payment } = await creditSale(agent, { total: 1000, paid: 200 });
    assert.equal(payment.due_amount, 800);

    const { body: partly } = await agent
      .post(`/api/user/payment/${payment._id}/collect`)
      .send({ amount: 300 })
      .expect(200);
    assert.equal(partly.paid_amount, 500);
    assert.equal(partly.due_amount, 500);
    assert.equal(partly.paid_status, 'partial_paid');

    const { body: settled } = await agent
      .post(`/api/user/payment/${payment._id}/collect`)
      .send({ amount: 500 })
      .expect(200);
    assert.equal(settled.due_amount, 0);
    assert.equal(settled.paid_status, 'full_paid');

    const { body: history } = await agent
      .get(`/api/user/payment/${payment._id}/history`)
      .expect(200);
    assert.deepEqual(
      history.map((row) => row.current_paid_amount),
      [200, 300, 500]
    );
  });

  it('refuses to collect more than is due', async () => {
    const { agent } = await loginAs(ctx.app);
    const { payment } = await creditSale(agent, { total: 100 });

    const { body } = await agent
      .post(`/api/user/payment/${payment._id}/collect`)
      .send({ amount: 150 })
      .expect(400);
    assert.match(body.err, /more than the amount due/);
    await agent.post(`/api/user/payment/${payment._id}/collect`).send({ amount: 0 }).expect(400);
  });

  it('ignores pending invoices until they are approved', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category } = await stockUp(agent, product, 10);
    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 1,
      total: 100,
      status: 'full_due',
    });

    const { body: before } = await agent.get('/api/user/creditcustomer').expect(200);
    assert.equal(before.length, 0, 'a pending invoice is not money owed yet');

    const { body: list } = await agent.get('/api/user/payment').expect(200);
    const { body } = await agent
      .post(`/api/user/payment/${list.rows[0]._id}/collect`)
      .send({ amount: 10 })
      .expect(400);
    assert.match(body.err, /Approve the invoice/);

    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(200);
    const { body: after } = await agent.get('/api/user/creditcustomer').expect(200);
    assert.equal(after.length, 1);
  });

  it("cannot collect another shop's payment", async () => {
    const { agent: shopA } = await loginAs(ctx.app);
    const { agent: shopB } = await loginAs(ctx.app);
    const { payment } = await creditSale(shopA, { total: 100 });

    await shopB.post(`/api/user/payment/${payment._id}/collect`).send({ amount: 10 }).expect(404);
  });
});

describe('dashboard', () => {
  it('summarises sales, receivables and stock', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent, { reorderLevel: 8 });
    const { category } = await stockUp(agent, product, 10);
    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 4,
      total: 400,
      paid: 100,
      status: 'partial_paid',
    });
    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(200);

    const { body } = await agent.get('/api/user/dashboard').expect(200);
    assert.equal(body.sales.today.total, 400);
    assert.equal(body.sales.thisMonth.invoices, 1);
    assert.equal(body.purchases.thisMonth.total, 100);
    assert.equal(body.receivables.total, 300);
    assert.equal(body.counts.products, 1);
    assert.equal(body.salesTrend.length, 6);
    assert.equal(body.salesTrend.at(-1).total, 400);
    assert.equal(body.topProducts[0].quantity, 4);
    assert.equal(body.lowStock.length, 1, 'stock of 6 is below the reorder level of 8');
  });
});
