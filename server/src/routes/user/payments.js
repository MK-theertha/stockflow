import { Router } from 'express';

import { HttpError, assertObjectId, found, json, ownedBy, route } from '../../lib/api.js';
import { collectPaymentSchema } from '../../lib/validators.js';
import { Invoice, Payment, PaymentDetail } from '../../models/index.js';

const router = Router();

// One payment record per invoice, with the invoice and customer filled in.
// This is what the invoice lists show: number, date, customer, totals, status.
router.get(
  '/payment',
  route(async ({ user }) => {
    const payments = await Payment.find(ownedBy(user))
      .populate(['invoice_id', 'customer_id'])
      .sort({ createdAt: -1 });
    return json(payments);
  })
);

// A pending invoice is still a draft, so only approved invoices count as money owed or paid.
const approvedInvoiceIds = (user) => Invoice.find(ownedBy(user, { status: true })).distinct('_id');

// Receivables: approved invoices that still have money due.
router.get(
  '/creditcustomer',
  route(async ({ user }) => {
    const payments = await Payment.find(
      ownedBy(user, {
        invoice_id: { $in: await approvedInvoiceIds(user) },
        due_amount: { $gt: 0 },
      })
    )
      .populate(['invoice_id', 'customer_id'])
      .sort({ createdAt: -1 });
    return json(payments);
  })
);

// Approved invoices that have been paid in full.
router.get(
  '/paidcustomer',
  route(async ({ user }) => {
    const payments = await Payment.find(
      ownedBy(user, {
        invoice_id: { $in: await approvedInvoiceIds(user) },
        paid_status: 'full_paid',
      })
    )
      .populate(['invoice_id', 'customer_id'])
      .sort({ createdAt: -1 });
    return json(payments);
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
