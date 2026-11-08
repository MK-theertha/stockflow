import { Router } from 'express';

import { json, ownedBy, route } from '../../lib/api.js';
import { endOfDay } from '../../lib/dates.js';
import { dateRangeSchema, reportSchema } from '../../lib/validators.js';
import { Category, Invoice, Payment, Product, Purchase, Supplier } from '../../models/index.js';

const router = Router();

router.post(
  '/dailyinvoicesreport',
  route(async ({ body, user }) => {
    const { startDate, endDate } = dateRangeSchema.parse(body);

    const invoices = await Invoice.find(
      ownedBy(user, { date: { $gte: startDate, $lte: endOfDay(endDate) } })
    )
      .sort({ date: -1 })
      .lean();

    // Attach each invoice's payment record (totals, customer) so the report can show amounts.
    const payments = await Payment.find({ invoice_id: { $in: invoices.map((i) => i._id) } })
      .populate('customer_id', 'name')
      .lean();
    const byInvoice = new Map(payments.map((p) => [String(p.invoice_id), p]));
    return json(
      invoices.map((invoice) => ({ ...invoice, payment: byInvoice.get(String(invoice._id)) }))
    );
  })
);

router.post(
  '/dailypurchasereport',
  route(async ({ body, user }) => {
    const { startDate, endDate } = dateRangeSchema.parse(body);

    const purchases = await Purchase.find(
      ownedBy(user, { date: { $gte: startDate, $lte: endOfDay(endDate) } })
    )
      .populate(['supplier_id', 'category_id', 'product_id'])
      .sort({ createdAt: -1 });
    return json(purchases);
  })
);

router.get(
  '/stockreport',
  route(async ({ user }) => {
    const products = await Product.find(ownedBy(user))
      .select('productName quantity reorderLevel categoryNameId')
      .populate('categoryNameId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return json(products);
  })
);

// Options for the supplier / category report filters.
router.get(
  '/supplierproductwisereport',
  route(async ({ user }) => {
    const [supplier, category] = await Promise.all([
      Supplier.find(ownedBy(user)).sort({ createdAt: -1 }),
      Category.find(ownedBy(user)).sort({ createdAt: -1 }),
    ]);
    return json({ supplier, category });
  })
);

// Products filtered by supplier or by category.
router.post(
  '/getReportData',
  route(async ({ body, user }) => {
    const { reportType, name } = reportSchema.parse(body);
    const field = reportType === 'supplier' ? 'supplierNameId' : 'categoryNameId';

    const products = await Product.find(ownedBy(user, { [field]: name })).populate([
      'supplierNameId',
      'categoryNameId',
    ]);
    return json(products);
  })
);

export default router;
