import mongoose from 'mongoose';

import { EXPENSE_CATEGORIES } from '@stockflow/shared/expenses';

import { owner } from './owner.js';

// Money the shop spends that is not stock: rent, salaries, electricity...
const ExpenseSchema = new mongoose.Schema(
  {
    ...owner,
    date: { type: Date, required: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidTo: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Expense', ExpenseSchema);
