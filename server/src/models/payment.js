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
  },
  { timestamps: true }
);

export default mongoose.model('Payment', PaymentSchema);
