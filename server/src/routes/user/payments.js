import { Router } from 'express';

import {
  HttpError,
  assertObjectId,
  containsText,
  findPage,
  found,
  json,
  ownedBy,
  route,
} from '../../lib/api.js';
import { collectPaymentSchema, listQuerySchema } from '../../lib/validators.js';
import { Customer, Invoice, Payment, PaymentDetail } from '../../models/index.js';

const router = Router();

// The invoice lists and receivables only show these fields of the linked records.
const withInvoiceAndCustomer = (query) =>
  query.populate('invoice_id', 'invoice_no date status').populate('customer_id', 'name');

// A pending invoice is still a draft, so it does not count as money owed or paid.
// Pending invoices are normally few, so excluding them with $nin stays cheap.
const pendingInvoiceIds = (user) => Invoice.find(ownedBy(user, { status: false })).distinct('_id');

// Matches the invoice number or the customer name.
const paymentSearch = async (user, q) => {
  const text = containsText(q);
  const [invoices, customers] = await Promise.all([
    Invoice.find(ownedBy(user, { invoice_no: text })).distinct('_id'),
    Customer.find(ownedBy(user, { name: text })).distinct('_id'),
  ]);
  return { $or: [{ invoice_id: { $in: invoices } }, { customer_id: { $in: customers } }] };
};

const paymentPage = async (user, filter, { q, ...paging }) => {
  const search = q ? await paymentSearch(user, q) : {};
  return findPage(Payment, ownedBy(user, { ...filter, ...search }), paging, withInvoiceAndCustomer);
};

// One payment record per invoice: number, date, customer, totals and status.
// This is what the invoice lists show. ?status=pending|approved filters them.
router.get(
  '/payment',
  route(async ({ req, user }) => {
    const { status, ...query } = listQuerySchema.parse(req.query);
    const filter = {};
    if (status === 'pending') filter.invoice_id = { $in: await pendingInvoiceIds(user) };
    if (status === 'approved') filter.invoice_id = { $nin: await pendingInvoiceIds(user) };
    return json(await paymentPage(user, filter, query));
  })
);

// Receivables: approved invoices that still have money due. Not paginated, because
// the page totals every open invoice and there should only ever be a manageable number.
router.get(
  '/creditcustomer',
  route(async ({ user }) => {
    const payments = await withInvoiceAndCustomer(
      Payment.find(
        ownedBy(user, {
          invoice_id: { $nin: await pendingInvoiceIds(user) },
          due_amount: { $gt: 0 },
        })
      )
    )
      .sort({ createdAt: -1 })
      .lean();
    return json(payments);
  })
);

// Approved invoices that have been paid in full.
router.get(
  '/paidcustomer',
  route(async ({ req, user }) => {
    const { status, ...query } = listQuerySchema.parse(req.query);
    const filter = {
      paid_status: 'full_paid',
      invoice_id: { $nin: await pendingInvoiceIds(user) },
    };
    return json(await paymentPage(user, filter, query));
  })
);

// Amounts under one paisa/cent left over from floating point maths count as settled.
const SETTLED_BELOW = 0.01;

// Records money received against an invoice that still has an amount due.
router.post(
  '/payment/:id/collect',
  route(async ({ body, params, user }) => {
    const { amount, date = new Date() } = collectPaymentSchema.parse(body);
    const filter = ownedBy(user, { _id: assertObjectId(params.id) });
    const existing = found(await Payment.findOne(filter), 'Payment');
    if (!(await Invoice.exists({ _id: existing.invoice_id, status: true }))) {
      throw new HttpError(400, 'Approve the invoice before collecting payments');
    }

    // The due_amount condition makes this atomic: two collections at the same
    // time can never take the balance below zero.
    const payment = await Payment.findOneAndUpdate(
      { ...filter, due_amount: { $gte: amount - SETTLED_BELOW } },
      { $inc: { paid_amount: amount, due_amount: -amount } },
      { new: true }
    );
    if (!payment) throw new HttpError(400, 'Amount is more than the amount due');

    if (payment.due_amount < SETTLED_BELOW) {
      payment.due_amount = 0;
      payment.paid_status = 'full_paid';
    } else {
      payment.paid_status = 'partial_paid';
    }
    await payment.save();

    await PaymentDetail.create({
      userId: payment.userId,
      invoice_id: payment.invoice_id,
      current_paid_amount: amount,
      date,
    });

    return json(await payment.populate(['invoice_id', 'customer_id']));
  })
);

// Every amount received for the invoice behind a payment, oldest first.
router.get(
  '/payment/:id/history',
  route(async ({ params, user }) => {
    const payment = found(
      await Payment.findOne(ownedBy(user, { _id: assertObjectId(params.id) })),
      'Payment'
    );
    const history = await PaymentDetail.find({ invoice_id: payment.invoice_id }).sort({ date: 1 });
    return json(history);
  })
);

export default router;
