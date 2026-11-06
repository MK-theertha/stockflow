import mongoose from 'mongoose';

import { owner } from './owner.js';

const PaymentDetailSchema = new mongoose.Schema(
  {
    ...owner,
    invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', index: true },
    current_paid_amount: { type: Number },
    date: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('PaymentDetails', PaymentDetailSchema);
