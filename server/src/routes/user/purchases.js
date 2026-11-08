import { Router } from 'express';

import {
  HttpError,
  assertObjectId,
  containsText,
  findPage,
  found,
  json,
  ownedBy,
  roundMoney,
  route,
} from '../../lib/api.js';
import { changeStock } from '../../lib/stock.js';
import { listQuerySchema, purchaseListSchema } from '../../lib/validators.js';
import { Product, Purchase, Supplier } from '../../models/index.js';

const router = Router();

// Matches the purchase number, the product name or the supplier name.
const purchaseSearch = async (user, q) => {
  const text = containsText(q);
  const [products, suppliers] = await Promise.all([
    Product.find(ownedBy(user, { productName: text })).distinct('_id'),
    Supplier.find(ownedBy(user, { name: text })).distinct('_id'),
  ]);
  return {
    $or: [
      { purchase_no: text },
      { product_id: { $in: products } },
      { supplier_id: { $in: suppliers } },
    ],
  };
};

// ?status=pending|approved filters the list and ?q= searches it.
router.get(
  '/',
  route(async ({ req, user }) => {
    const { status, q, ...paging } = listQuerySchema.parse(req.query);
    const filter = ownedBy(user, q ? await purchaseSearch(user, q) : {});
    if (status) filter.status = status === 'approved';

    const page = await findPage(Purchase, filter, paging, (query) =>
      query.populate('supplier_id', 'name').populate('product_id', 'productName')
    );
    return json(page);
  })
);

// Creates one pending purchase per row. Stock is only added once a purchase is approved.
router.post(
  '/',
  route(async ({ body, user }) => {
    const rows = purchaseListSchema.parse(body);

    // Every product and supplier must belong to this shop.
    const productIds = [...new Set(rows.map((row) => row.selectedProduct))];
    const products = await Product.find(ownedBy(user, { _id: { $in: productIds } }));
    if (products.length !== productIds.length) {
      throw new HttpError(400, 'Unknown product in purchase');
    }
    const supplierIds = [...new Set(rows.map((row) => row.supplierName))];
    const suppliers = await Supplier.countDocuments(ownedBy(user, { _id: { $in: supplierIds } }));
    if (suppliers !== supplierIds.length) throw new HttpError(400, 'Unknown supplier in purchase');

    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const purchases = await Purchase.insertMany(
      rows.map((row) => {
        const product = productsById.get(row.selectedProduct);
        return {
          // The product's shop, so an admin entering a purchase files it under that shop.
          userId: product.userId,
          product_id: product._id,
          supplier_id: row.supplierName,
          category_id: row.selectedCategory ?? product.categoryNameId,
          date: row.startDate,
          buying_qty: row.quantity,
          unit_price: row.unitPrice,
          // Totals are always computed here, never taken from the browser.
          buying_price: roundMoney(row.quantity * row.unitPrice),
          description: row.description,
          purchase_no: row.purchaseNo,
          status: false,
        };
      })
    );
    return json(purchases, 201);
  })
);

// Approves a pending purchase and adds its quantity to the product's stock.
router.put(
  '/:id',
  route(async ({ params, user }) => {
    const filter = ownedBy(user, { _id: assertObjectId(params.id) });
    const pending = found(await Purchase.findOne(filter), 'Purchase');
    if (pending.status) throw new HttpError(400, 'Purchase already approved');

    found(await Product.exists({ _id: pending.product_id }), 'Product');

    // Flip the status atomically so a double click cannot add the stock twice.
    const purchase = await Purchase.findOneAndUpdate(
      { ...filter, status: false },
      { status: true },
      { new: true }
    );
    if (!purchase) throw new HttpError(400, 'Purchase already approved');

    const product = await changeStock({
      productId: purchase.product_id,
      quantity: purchase.buying_qty,
      type: 'purchase',
      reference: purchase._id,
      note: `Purchase ${purchase.purchase_no}`,
    });
    return json({ purchase, product });
  })
);

// Deletes a purchase. If it was approved, its stock is taken back out through the
// ledger, which is refused when that stock has already been sold.
router.delete(
  '/:id',
  route(async ({ params, user }) => {
    // Delete first so two simultaneous deletes cannot both reverse the stock.
    const purchase = found(
      await Purchase.findOneAndDelete(ownedBy(user, { _id: assertObjectId(params.id) })),
      'Purchase'
    );

    if (purchase.status && (await Product.exists({ _id: purchase.product_id }))) {
      const product = await changeStock({
        productId: purchase.product_id,
        quantity: -purchase.buying_qty,
        type: 'reversal',
        reference: purchase._id,
        note: `Purchase ${purchase.purchase_no} deleted`,
      });
      if (!product) {
        await Purchase.create(purchase.toObject());
        throw new HttpError(
          400,
          'Some of this stock has already been sold, so the purchase cannot be deleted. ' +
            'Use a stock adjustment instead.'
        );
      }
    }
    return json(purchase);
  })
);

export default router;
