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

export default mongoose.model('Invoice', InvoiceSchema);
