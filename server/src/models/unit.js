import mongoose from 'mongoose';

import { owner } from './owner.js';

const UnitSchema = new mongoose.Schema(
  {
    ...owner,
    name: { type: String, required: true, trim: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Unit', UnitSchema);
