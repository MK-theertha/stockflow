import mongoose from 'mongoose';

import { owner } from './owner.js';

const CategorySchema = new mongoose.Schema(
  {
    ...owner,
    name: { type: String, required: true, trim: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', CategorySchema);
