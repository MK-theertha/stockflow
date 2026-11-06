import { Router } from 'express';

import { json, ownedBy, ownedMatch, route } from '../../lib/api.js';
import {
  Customer,
  Expense,
  Invoice,
  InvoiceDetail,
  Payment,
  Product,
  Purchase,
  Supplier,
} from '../../models/index.js';

const MONTHS_OF_HISTORY = 6;
const TOP_PRODUCTS = 5;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date, monthsBack = 0) =>
  new Date(date.getFullYear(), date.getMonth() - monthsBack, 1);
const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

// Sales = approved invoices. The amount lives on the invoice's Payment record.
const salesByMonth = (match, from) =>
  Invoice.aggregate([
    { $match: { ...match, status: true, date: { $gte: from } } },
    {
      $lookup: {
        from: Payment.collection.name,
        localField: '_id',
        foreignField: 'invoice_id',
        as: 'payment',
      },
    },
    { $unwind: '$payment' },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$payment.total_amount' },
        invoices: { $sum: 1 },
      },
    },
  ]);

const salesSince = async (match, from) => {
  const [row] = await Invoice.aggregate([
    { $match: { ...match, status: true, date: { $gte: from } } },
    {
      $lookup: {
        from: Payment.collection.name,
        localField: '_id',
        foreignField: 'invoice_id',
        as: 'payment',
      },
    },
    { $unwind: '$payment' },
    { $group: { _id: null, total: { $sum: '$payment.total_amount' }, invoices: { $sum: 1 } } },
  ]);
  return { total: row?.total ?? 0, invoices: row?.invoices ?? 0 };
};

const purchasesSince = async (match, from) => {
  const [row] = await Purchase.aggregate([
    { $match: { ...match, status: true, date: { $gte: from } } },
    { $group: { _id: null, total: { $sum: '$buying_price' }, purchases: { $sum: 1 } } },
  ]);
  return { total: row?.total ?? 0, purchases: row?.purchases ?? 0 };
};

const expensesSince = async (match, from) => {
  const [row] = await Expense.aggregate([
    { $match: { ...match, date: { $gte: from } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return { total: row?.total ?? 0 };
};

// Money owed on approved invoices (a pending invoice is still a draft).
const receivables = async (match) => {
  const [row] = await Payment.aggregate([
    { $match: { ...match, due_amount: { $gt: 0 } } },
    {
      $lookup: {
        from: Invoice.collection.name,
        localField: 'invoice_id',
        foreignField: '_id',
        as: 'invoice',
      },
    },
    { $match: { 'invoice.status': true } },
    { $group: { _id: null, total: { $sum: '$due_amount' }, invoices: { $sum: 1 } } },
  ]);
  return { total: row?.total ?? 0, invoices: row?.invoices ?? 0 };
};

// Best sellers by quantity, counting only approved invoices.
const topProducts = (match) =>
  InvoiceDetail.aggregate([
    { $match: match },
    {
      $lookup: {
        from: Invoice.collection.name,
        localField: 'invoice_id',
        foreignField: '_id',
        as: 'invoice',
      },
    },
    { $match: { 'invoice.status': true } },
    {
      $group: {
        _id: '$product_id',
        quantity: { $sum: '$selling_qty' },
        revenue: { $sum: '$selling_price' },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: TOP_PRODUCTS },
    {
      $lookup: {
        from: Product.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $project: {
        _id: 1,
        quantity: 1,
        revenue: 1,
        productName: { $ifNull: [{ $first: '$product.productName' }, 'Deleted product'] },
      },
    },
  ]);

const lowStockFilter = {
  reorderLevel: { $gt: 0 },
  $expr: { $lte: ['$quantity', '$reorderLevel'] },
};

const router = Router();

// Everything the dashboard shows, in one request. Admins get platform-wide totals.
router.get(
  '/',
  route(async ({ user }) => {
    const now = new Date();
    const historyFrom = startOfMonth(now, MONTHS_OF_HISTORY - 1);
    const match = ownedMatch(user);

    const [
      today,
      thisMonth,
      purchasesThisMonth,
      expensesThisMonth,
      due,
      monthly,
      best,
      lowStock,
      recentPayments,
      products,
      customers,
      suppliers,
      pendingInvoices,
      pendingPurchases,
    ] = await Promise.all([
      salesSince(match, startOfDay(now)),
      salesSince(match, startOfMonth(now)),
      purchasesSince(match, startOfMonth(now)),
      expensesSince(match, startOfMonth(now)),
      receivables(match),
      salesByMonth(match, historyFrom),
      topProducts(match),
      Product.find(ownedBy(user, lowStockFilter)).sort({ quantity: 1 }).limit(5),
      Payment.find(ownedBy(user))
        .populate(['invoice_id', 'customer_id'])
        .sort({ createdAt: -1 })
        .limit(5),
      Product.countDocuments(ownedBy(user)),
      Customer.countDocuments(ownedBy(user)),
      Supplier.countDocuments(ownedBy(user)),
      Invoice.countDocuments(ownedBy(user, { status: false })),
      Purchase.countDocuments(ownedBy(user, { status: false })),
    ]);

    // Fill in months without sales so the chart has no gaps.
    const byKey = new Map(monthly.map((row) => [monthKey(row._id.year, row._id.month), row]));
    const salesTrend = Array.from({ length: MONTHS_OF_HISTORY }, (_, index) => {
      const month = startOfMonth(now, MONTHS_OF_HISTORY - 1 - index);
      const row = byKey.get(monthKey(month.getFullYear(), month.getMonth() + 1));
      return {
        month: month.toLocaleString('en', { month: 'short', year: 'numeric' }),
        total: row?.total ?? 0,
        invoices: row?.invoices ?? 0,
      };
    });

    return json({
      sales: { today, thisMonth },
      purchases: { thisMonth: purchasesThisMonth },
      expenses: { thisMonth: expensesThisMonth },
      receivables: due,
      counts: { products, customers, suppliers, pendingInvoices, pendingPurchases },
      salesTrend,
      topProducts: best,
      lowStock,
      recentPayments,
    });
  })
);

export default router;
