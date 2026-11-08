import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInvoice, createProduct, loginAs, stockUp, useTestApp } from './helpers.js';

const ctx = useTestApp();

describe('payment copies of invoice fields', () => {
  it('marks the payment approved when its invoice is approved', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category } = await stockUp(agent, product, 10);
    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 1,
      total: 50,
      status: 'full_paid',
    });
    const { Payment } = ctx.models;

    let payment = await Payment.findOne({ invoice_id: invoice._id }).lean();
    assert.equal(payment.approved, false);
    assert.equal(payment.invoice_date.toISOString(), new Date(invoice.date).toISOString());

    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(200);
    payment = await Payment.findOne({ invoice_id: invoice._id }).lean();
    assert.equal(payment.approved, true);
  });

  it('stays unapproved when approval fails for lack of stock', async () => {
    const { agent } = await loginAs(ctx.app);
    const product = await createProduct(agent);
    const { category } = await stockUp(agent, product, 1);
    const invoice = await createInvoice(agent, {
      product,
      category,
      quantity: 5,
      total: 50,
      status: 'full_due',
    });
    await agent.post('/api/user/invoiceapprove').send({ invoiceId: invoice._id }).expect(400);

    const payment = await ctx.models.Payment.findOne({ invoice_id: invoice._id }).lean();
    assert.equal(payment.approved, false);
  });

  it('fills in payments created before the fields existed', async () => {
    const { Invoice, Payment } = ctx.models;
    const { backfillPaymentInvoiceFields } = await import('../src/lib/backfill.js');
    const userId = new (await import('mongoose')).default.Types.ObjectId();
    const date = new Date('2026-01-15');

    const [approved, pending] = await Invoice.insertMany([
      { userId, invoice_no: 'OLD-1', date, status: true },
      { userId, invoice_no: 'OLD-2', date, status: false },
    ]);
    // Written straight to the collection, like data from before the change.
    await Payment.collection.insertMany([
      { userId, invoice_id: approved._id, total_amount: 10 },
      { userId, invoice_id: pending._id, total_amount: 20 },
    ]);

    assert.equal(await backfillPaymentInvoiceFields(), 2);
    const byInvoice = async (id) => Payment.findOne({ invoice_id: id }).lean();
    assert.equal((await byInvoice(approved._id)).approved, true);
    assert.equal((await byInvoice(pending._id)).approved, false);
    assert.equal((await byInvoice(approved._id)).invoice_date.toISOString(), date.toISOString());

    assert.equal(await backfillPaymentInvoiceFields(), 0, 'running again changes nothing');
  });
});
