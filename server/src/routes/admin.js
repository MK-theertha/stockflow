import { Router } from 'express';

import { json, route } from '../lib/api.js';
import {
  Category,
  Customer,
  Invoice,
  InvoiceDetail,
  Payment,
  PaymentDetail,
  Product,
  Purchase,
  Subscription,
  Supplier,
  Unit,
  User,
} from '../models/index.js';

const COUNTED = {
  categorycount: Category,
  customercount: Customer,
  invoicecount: Invoice,
  invoicedetailscount: InvoiceDetail,
  paymentcount: Payment,
  paymentdetailscount: PaymentDetail,
  productcount: Product,
  purchasescount: Purchase,
  subscriptioncount: Subscription,
  suppliercount: Supplier,
  unitcount: Unit,
};

const router = Router();

const adminRoute = (handler) => route(handler, { roles: ['admin'], subscription: false });

// Platform-wide record counts for the admin dashboard.
router.get(
  '/',
  adminRoute(async () => {
    const entries = await Promise.all(
      Object.entries(COUNTED).map(async ([key, Model]) => [
        key,
        await Model.estimatedDocumentCount(),
      ])
    );
    return json(Object.fromEntries(entries));
  })
);

const countByOwner = (Model, userIds) =>
  Model.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);

// Every shop with its subscription status and how much it uses the system.
router.get(
  '/shops',
  adminRoute(async () => {
    const shops = await User.find({ role: 'user' }).sort({ createdAt: -1 }).lean();
    const ids = shops.map((shop) => shop._id);

    const [subscriptions, products, invoices] = await Promise.all([
      Subscription.find({ userId: { $in: ids } }).lean(),
      countByOwner(Product, ids),
      countByOwner(Invoice, ids),
    ]);

    const toMap = (rows, value) => new Map(rows.map((row) => [String(row._id), value(row)]));
    const endDates = new Map(subscriptions.map((sub) => [String(sub.userId), sub.endDate]));
    const productCounts = toMap(products, (row) => row.count);
    const invoiceCounts = toMap(invoices, (row) => row.count);
    const now = new Date();

    return json(
      shops.map((shop) => {
        const id = String(shop._id);
        const subscriptionEnd = endDates.get(id) ?? null;
        return {
          _id: id,
          name: shop.name,
          email: shop.email,
          phone: shop.phone,
          createdAt: shop.createdAt,
          subscriptionEnd,
          active: Boolean(subscriptionEnd && subscriptionEnd > now),
          products: productCounts.get(id) ?? 0,
          invoices: invoiceCounts.get(id) ?? 0,
        };
      })
    );
  })
);

export default router;
