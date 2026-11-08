import mongoose from 'mongoose';

import { owner } from './owner.js';

const InvoiceSchema = new mongoose.Schema(
  {
    ...owner,
    invoice_no: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, trim: true },
    // false = pending approval, true = approved and deducted from stock
    status: { type: Boolean, default: false },
  },
  { timestamps: true }
);

InvoiceSchema.index({ userId: 1, status: 1, date: -1 });
InvoiceSchema.index({ userId: 1, invoice_no: 1 });

export default mongoose.model('Invoice', InvoiceSchema);
