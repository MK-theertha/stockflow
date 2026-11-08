import mongoose from 'mongoose';

import { owner } from './owner.js';

const { ObjectId } = mongoose.Schema.Types;

const PurchaseSchema = new mongoose.Schema(
  {
    ...owner,
    supplier_id: { type: ObjectId, ref: 'Supplier' },
    category_id: { type: ObjectId, ref: 'Category' },
    product_id: { type: ObjectId, ref: 'Product' },
    date: { type: Date },
    purchase_no: { type: String, required: true },
    description: { type: String, trim: true },
    buying_qty: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    buying_price: { type: Number, required: true },
    // false = pending, true = approved and added to stock
    status: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PurchaseSchema.index({ userId: 1, createdAt: -1 });
PurchaseSchema.index({ userId: 1, status: 1, date: -1 });

// The model name stays 'Purchases' so the existing `purchases` collection is reused.
export default mongoose.model('Purchases', PurchaseSchema);
