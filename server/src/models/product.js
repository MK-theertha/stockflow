import mongoose from 'mongoose';

import { owner } from './owner.js';

const { ObjectId } = mongoose.Schema.Types;

const ProductSchema = new mongoose.Schema(
  {
    ...owner,
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    // Stock at or below this level counts as "low stock". 0 turns the alert off.
    reorderLevel: { type: Number, default: 0, min: 0 },
    status: { type: Boolean, default: true },
    supplierNameId: { type: ObjectId, ref: 'Supplier' },
    unitNameId: { type: ObjectId, ref: 'Unit' },
    categoryNameId: { type: ObjectId, ref: 'Category' },
  },
  { timestamps: true }
);

export const PRODUCT_REFS = ['supplierNameId', 'unitNameId', 'categoryNameId'];

export default mongoose.model('Product', ProductSchema);
