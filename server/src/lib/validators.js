import mongoose from 'mongoose';
import { z } from 'zod';

import { EXPENSE_CATEGORIES } from '@stockflow/shared/expenses';
import { PAYMENT_STATUSES } from '../models/payment.js';

// Forms sometimes send a populated document ({ _id, name }) instead of a bare id.
const objectId = z.preprocess(
  (value) => (value && typeof value === 'object' ? value._id : value),
  z.string().refine((value) => mongoose.isValidObjectId(value), 'must be a valid id')
);

const optionalObjectId = z.preprocess(
  (value) => (value === '' ? undefined : value),
  objectId.optional()
);

const name = z.string().trim().min(1, 'is required').max(100);
const email = z.string().trim().toLowerCase().email('must be a valid email');
const amount = z.coerce.number().finite().min(0, 'cannot be negative');
const date = z.coerce.date();

export const namedSchema = z.object({ name });

export const customerSchema = z.object({
  name,
  email,
  mobileNumber: z.coerce.number().int().positive('must be a valid phone number'),
  address: z.string().trim().max(500).optional(),
  // The form sends '' when there is no photo.
  image: z.preprocess((value) => (value === '' ? null : value), z.string().url().nullish()),
});

export const supplierSchema = z.object({
  name,
  email,
  phone: z.coerce.number().int().positive('must be a valid phone number'),
  address: z.string().trim().min(1, 'is required').max(500),
});

export const productSchema = z.object({
  productName: name,
  supplierNameId: optionalObjectId,
  unitNameId: optionalObjectId,
  categoryNameId: optionalObjectId,
  reorderLevel: z.coerce.number().int().min(0).optional(),
});

export const purchaseListSchema = z
  .array(
    z.object({
      purchaseNo: z.string().trim().min(1, 'is required'),
      supplierName: objectId,
      // Optional: the server uses the product's own category when it is missing.
      selectedCategory: optionalObjectId,
      selectedProduct: objectId,
      startDate: date,
      quantity: z.coerce.number().int().positive(),
      unitPrice: amount,
      description: z.string().trim().max(500).optional(),
      // Ignored: the server computes quantity × unitPrice itself.
      totalPrice: amount.optional(),
    })
  )
  .min(1, 'Add at least one purchase');

export const invoiceSchema = z.object({
  date,
  description: z.string().trim().max(500).optional(),
  // Ignored: the server computes the total from the lines and the discount.
  grandTotal: amount.optional(),
  discount: amount.optional().default(0),
  partialAmount: z.preprocess((value) => (value === '' ? 0 : value), amount.optional().default(0)),
  status: z.enum(PAYMENT_STATUSES),
  selectedCustomer: z.union([z.literal('new_customer'), objectId]),
  name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.coerce.number().optional(),
  purchaseData: z
    .array(
      z.object({
        selectedProduct: objectId,
        selectedCategory: optionalObjectId,
        startDate: date.optional(),
        quantity: z.coerce.number().int().positive(),
        unitPrice: amount,
        totalPrice: amount.optional(),
      })
    )
    .min(1, 'Add at least one product'),
});

export const dateRangeSchema = z.object({ startDate: date, endDate: date });

export const reportSchema = z.object({
  reportType: z.enum(['supplier', 'category']),
  name: objectId,
});

export const registerSchema = z.object({
  name: z.string().trim().min(3).max(20),
  email,
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(6, 'must be at least 6 characters').max(100),
});

export const checkoutSchema = z.object({
  plan: z.string(),
  billingPeriod: z.enum(['monthly', 'annual']),
});

export const profileSchema = z.object({
  name: z.string().trim().min(3).max(20),
  phone: z.string().trim().max(20).optional(),
  image: z.string().url().nullish().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'is required'),
  newPassword: z.string().min(6, 'must be at least 6 characters').max(100),
});

export const collectPaymentSchema = z.object({
  amount: z.coerce.number().finite().positive('must be more than 0'),
  date: date.optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: objectId,
  quantity: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, 'cannot be 0'),
  note: z.string().trim().min(1, 'is required').max(200),
});

export const expenseSchema = z.object({
  date,
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().finite().positive('must be more than 0'),
  paidTo: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
});
