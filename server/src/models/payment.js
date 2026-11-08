import mongoose from 'mongoose';

import { owner } from './owner.js';

const { ObjectId } = mongoose.Schema.Types;

export const PAYMENT_STATUSES = ['full_paid', 'full_due', 'partial_paid'];

const PaymentSchema = new mongoose.Schema(
  {
    ...owner,
    invoice_id: { type: ObjectId, ref: 'Invoice', index: true },
    customer_id: { type: ObjectId, ref: 'Customer' },
    paid_status: { type: String, enum: PAYMENT_STATUSES },
    paid_amount: { type: Number },
    due_amount: { type: Number },
    total_amount: { type: Number },
    discount_amount: { type: Number },
    // Copies of the invoice's date and approval status (denormalised), so sales can be
    // summed from payments alone without a $lookup. Kept in sync by invoice creation and
    // approveInvoice(); older records are filled in at startup by lib/backfill.js.
    invoice_date: { type: Date },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, due_amount: 1 });
PaymentSchema.index({ userId: 1, paid_status: 1, createdAt: -1 });
PaymentSchema.index({ customer_id: 1 });
PaymentSchema.index({ userId: 1, approved: 1, invoice_date: -1 });

export default mongoose.model('Payment', PaymentSchema);
