import mongoose from 'mongoose';

import { owner } from './owner.js';

const CustomerSchema = new mongoose.Schema(
  {
    ...owner,
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobileNumber: { type: Number, required: true },
    image: { type: String },
    address: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Emails are unique per shop, not globally.
CustomerSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.model('Customer', CustomerSchema);
