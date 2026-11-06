import mongoose from 'mongoose';

import { owner } from './owner.js';

const { ObjectId } = mongoose.Schema.Types;

const InvoiceDetailSchema = new mongoose.Schema(
  {
    ...owner,
    date: { type: Date, required: true },
    invoice_id: { type: ObjectId, ref: 'Invoice', index: true },
    category_id: { type: ObjectId, ref: 'Category' },
    product_id: { type: ObjectId, ref: 'Product' },
    selling_qty: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// The model name stays 'Invoicedetails' so the existing collection is reused.
export default mongoose.model('Invoicedetails', InvoiceDetailSchema);
