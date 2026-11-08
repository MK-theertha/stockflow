import { Router } from 'express';

import { HttpError, assertObjectId, found, json, ownedBy, route } from '../../lib/api.js';
import { changeStock } from '../../lib/stock.js';
import { stockAdjustmentSchema } from '../../lib/validators.js';
import { Product, StockMovement } from '../../models/index.js';
import { LOW_STOCK_FILTER } from '../../models/product.js';

const MOVEMENT_LIMIT = 200;

const router = Router();

// The stock ledger, newest first. ?productId= narrows it to one product.
router.get(
  '/movements',
  route(async ({ req, user }) => {
    const filter = ownedBy(user);
    if (req.query.productId) filter.product_id = assertObjectId(req.query.productId, 'productId');

    const movements = await StockMovement.find(filter)
      .populate('product_id', 'productName')
      .sort({ createdAt: -1 })
      .limit(MOVEMENT_LIMIT)
      .lean();
    return json(movements);
  })
);

// Corrects stock by hand, e.g. after damage or a physical count.
router.post(
  '/adjustments',
  route(async ({ body, user }) => {
    const { productId, quantity, note } = stockAdjustmentSchema.parse(body);
    const filter = ownedBy(user);

    const product = await changeStock({ productId, quantity, type: 'adjustment', note, filter });
    if (!product) {
      found(await Product.exists({ ...filter, _id: productId }), 'Product');
      throw new HttpError(400, 'Not enough stock to remove that quantity');
    }
    return json(product, 201);
  })
);

// Products at or below their reorder level.
router.get(
  '/low',
  route(async ({ user }) => {
    const products = await Product.find(ownedBy(user, LOW_STOCK_FILTER))
      .populate('supplierNameId', 'name')
      .populate('unitNameId', 'name')
      .sort({ quantity: 1 })
      .lean();
    return json(products);
  })
);

export default router;
