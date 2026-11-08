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

ProductSchema.index({ userId: 1, createdAt: -1 });

// Products at or below their reorder level.
export const LOW_STOCK_FILTER = {
  reorderLevel: { $gt: 0 },
  $expr: { $lte: ['$quantity', '$reorderLevel'] },
};

// The linked records as the product list and forms need them: id and name only.
export const PRODUCT_REFS = ['supplierNameId', 'unitNameId', 'categoryNameId'].map((path) => ({
  path,
  select: 'name',
}));

export default mongoose.model('Product', ProductSchema);
