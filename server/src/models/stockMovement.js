import mongoose from 'mongoose';

import { owner } from './owner.js';

const { ObjectId } = mongoose.Schema.Types;

// purchase   = an approved purchase added stock
// sale       = an approved invoice removed stock
// adjustment = stock corrected by hand (damage, loss, stock count)
// reversal   = an approved purchase or invoice was deleted, so its movement is undone
export const MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'reversal'];

// The stock ledger: one row per change to a product's quantity, never edited
// afterwards. Product.quantity is the running total of these rows.
const StockMovementSchema = new mongoose.Schema(
  {
    ...owner,
    product_id: { type: ObjectId, ref: 'Product', required: true, index: true },
    type: { type: String, enum: MOVEMENT_TYPES, required: true },
    // Positive when stock comes in, negative when it goes out.
    quantity: { type: Number, required: true },
    // Product quantity right after this movement.
    balance: { type: Number, required: true },
    // The purchase or invoice that caused the movement, if any.
    reference: { type: ObjectId, index: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

StockMovementSchema.index({ userId: 1, createdAt: -1 });
StockMovementSchema.index({ product_id: 1, createdAt: -1 });

export default mongoose.model('StockMovement', StockMovementSchema);
