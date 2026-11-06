import mongoose from 'mongoose';

import { owner } from './owner.js';

const SupplierSchema = new mongoose.Schema(
  {
    ...owner,
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: Number, required: true },
    address: { type: String, required: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Emails are unique per shop, not globally.
SupplierSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.model('Supplier', SupplierSchema);
