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
import { LOW_STOCK_FILTER } from '../../models/product.js';

const MONTHS_OF_HISTORY = 6;
const TOP_PRODUCTS = 5;

// Group by month in the server's timezone, the same one startOfMonth() below uses.
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date, monthsBack = 0) =>
  new Date(date.getFullYear(), date.getMonth() - monthsBack, 1);
const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

// One pass over approved sales gives the monthly trend and today's sales together.
// Payments carry a copy of their invoice's date and approval, so no $lookup is needed.
const salesByMonth = (match, from, today) =>
  Payment.aggregate([
    { $match: { ...match, approved: true, invoice_date: { $gte: from } } },
    { $addFields: { isToday: { $gte: ['$invoice_date', today] } } },
    {
      $group: {
        _id: {
          year: { $year: { date: '$invoice_date', timezone: TIMEZONE } },
          month: { $month: { date: '$invoice_date', timezone: TIMEZONE } },
        },
        total: { $sum: '$total_amount' },
        invoices: { $sum: 1 },
        todayTotal: { $sum: { $cond: ['$isToday', '$total_amount', 0] } },
        todayInvoices: { $sum: { $cond: ['$isToday', 1, 0] } },
      },
    },
  ]);

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
const receivables = async (match, pendingIds) => {
  const [row] = await Payment.aggregate([
    { $match: { ...match, due_amount: { $gt: 0 }, invoice_id: { $nin: pendingIds } } },
    { $group: { _id: null, total: { $sum: '$due_amount' }, invoices: { $sum: 1 } } },
  ]);
  return { total: row?.total ?? 0, invoices: row?.invoices ?? 0 };
};

// Best sellers by quantity, counting only approved invoices.
const topProducts = (match, pendingIds) =>
  InvoiceDetail.aggregate([
    { $match: { ...match, invoice_id: { $nin: pendingIds } } },
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

const router = Router();

// Everything the dashboard shows, in one request. Admins get platform-wide totals.
router.get(
  '/',
  route(async ({ user }) => {
    const now = new Date();
    const match = ownedMatch(user);

    // Pending invoices are normally few, so excluding them with $nin is much
    // cheaper than looking up the invoice of every payment or line item.
    const pendingIds = await Invoice.find(ownedBy(user, { status: false })).distinct('_id');

    const [
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
      pendingPurchases,
    ] = await Promise.all([
      purchasesSince(match, startOfMonth(now)),
      expensesSince(match, startOfMonth(now)),
      receivables(match, pendingIds),
      salesByMonth(match, startOfMonth(now, MONTHS_OF_HISTORY - 1), startOfDay(now)),
      topProducts(match, pendingIds),
      Product.find(ownedBy(user, LOW_STOCK_FILTER))
        .select('productName quantity reorderLevel')
        .sort({ quantity: 1 })
        .limit(5)
        .lean(),
      Payment.find(ownedBy(user))
        .select('invoice_id customer_id total_amount paid_status')
        .populate('invoice_id', 'invoice_no date')
        .populate('customer_id', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Product.countDocuments(ownedBy(user)),
      Customer.countDocuments(ownedBy(user)),
      Supplier.countDocuments(ownedBy(user)),
      Purchase.countDocuments(ownedBy(user, { status: false })),
    ]);

    // Fill in months without sales so the chart has no gaps.
    const byKey = new Map(monthly.map((row) => [monthKey(row._id.year, row._id.month), row]));
    const rowFor = (month) => byKey.get(monthKey(month.getFullYear(), month.getMonth() + 1));
    const salesTrend = Array.from({ length: MONTHS_OF_HISTORY }, (_, index) => {
      const month = startOfMonth(now, MONTHS_OF_HISTORY - 1 - index);
      const row = rowFor(month);
      return {
        month: month.toLocaleString('en', { month: 'short', year: 'numeric' }),
        total: row?.total ?? 0,
        invoices: row?.invoices ?? 0,
      };
    });
    const current = rowFor(now);

    return json({
      sales: {
        today: { total: current?.todayTotal ?? 0, invoices: current?.todayInvoices ?? 0 },
        thisMonth: { total: current?.total ?? 0, invoices: current?.invoices ?? 0 },
      },
      purchases: { thisMonth: purchasesThisMonth },
      expenses: { thisMonth: expensesThisMonth },
      receivables: due,
      counts: {
        products,
        customers,
        suppliers,
        pendingInvoices: pendingIds.length,
        pendingPurchases,
      },
      salesTrend,
      topProducts: best,
      lowStock,
      recentPayments,
    });
  })
);

export default router;
