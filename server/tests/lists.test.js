import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInvoice, createProduct, loginAs, stockUp, useTestApp } from './helpers.js';

const ctx = useTestApp();

async function shopWithInvoices(count) {
  const { agent } = await loginAs(ctx.app);
  const product = await createProduct(agent, { productName: 'Rice' });
  const { category } = await stockUp(agent, product, 100);
  const invoices = [];
  for (let i = 0; i < count; i++) {
    invoices.push(
      await createInvoice(agent, { product, category, quantity: 1, total: 10, status: 'full_paid' })
    );
  }
  return { agent, invoices };
}

describe('paginated lists', () => {
  it('returns one page at a time with the total', async () => {
    const { agent } = await shopWithInvoices(3);

    const { body: first } = await agent.get('/api/user/payment?limit=2').expect(200);
    assert.equal(first.rows.length, 2);
    assert.equal(first.total, 3);

    const { body: second } = await agent.get('/api/user/payment?limit=2&page=1').expect(200);
    assert.equal(second.rows.length, 1);
    assert.notEqual(second.rows[0]._id, first.rows[0]._id);
  });

  it('filters invoices by approval status', async () => {
    const { agent, invoices } = await shopWithInvoices(2);
    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoices[0]._id }).expect(200);

    const { body: pending } = await agent.get('/api/user/payment?status=pending').expect(200);
    assert.equal(pending.total, 1);
    assert.equal(pending.rows[0].invoice_id._id, invoices[1]._id);

    const { body: approved } = await agent.get('/api/user/payment?status=approved').expect(200);
    assert.equal(approved.total, 1);
    assert.equal(approved.rows[0].invoice_id._id, invoices[0]._id);

    const { body: paid } = await agent.get('/api/user/paidcustomer').expect(200);
    assert.equal(paid.total, 1, 'a pending invoice does not count as paid');
  });

  it('searches by invoice number and customer, treating the text literally', async () => {
    const { agent, invoices } = await shopWithInvoices(2);

    const byNumber = invoices[1].invoice_no;
    const { body: found } = await agent.get(`/api/user/payment?q=${byNumber}`).expect(200);
    assert.equal(found.total, 1);

    const { body: byCustomer } = await agent.get('/api/user/payment?q=WALK-IN').expect(200);
    assert.equal(byCustomer.total, 2);

    const { body: pattern } = await agent.get('/api/user/payment?q=.*').expect(200);
    assert.equal(pattern.total, 0, 'regex characters are not treated as a pattern');
  });

  it('filters and searches purchases', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent, { productName: 'Sugar' });
    await stockUp(agent, product, 5);

    const list = async (query) =>
      (await agent.get(`/api/user/purchases?${query}`).expect(200)).body.total;
    assert.equal(await list('status=approved'), 1);
    assert.equal(await list('status=pending'), 0);
    assert.equal(await list('q=sugar'), 1);
    assert.equal(await list('q=salt'), 0);
  });

  it('rejects invalid list parameters and stays within the shop', async () => {
    const { agent } = await shopWithInvoices(1);
    await agent.get('/api/user/payment?limit=5000').expect(400);
    await agent.get('/api/user/payment?page=-1').expect(400);
    await agent.get('/api/user/payment?status=nonsense').expect(400);
    await agent.get('/api/user/payment?q[$ne]=x').expect(400);

    const { agent: other } = await loginAs(ctx.app);
    const { body } = await other.get('/api/user/payment?q=walk').expect(200);
    assert.equal(body.total, 0);
  });
});
