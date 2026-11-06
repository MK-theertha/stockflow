import { Router } from 'express';

import { assertObjectId, found, json, ownedBy, route } from '../../lib/api.js';
import {
  customerSchema,
  namedSchema,
  productSchema,
  supplierSchema,
} from '../../lib/validators.js';
import { Category, Customer, Product, Supplier, Unit } from '../../models/index.js';
import { PRODUCT_REFS } from '../../models/product.js';

const router = Router();

// Categories and units only have a name, so they share the same handlers.
for (const [path, Model, label] of [
  ['/category', Category, 'Category'],
  ['/unit', Unit, 'Unit'],
]) {
  router.get(
    path,
    route(async ({ user }) => json(await Model.find(ownedBy(user)).sort({ createdAt: -1 })))
  );

  router.post(
    path,
    route(async ({ body, user }) => {
      const { name } = namedSchema.parse(body);
      return json(await Model.create({ name, userId: user._id }), 201);
    })
  );

  router.put(
    `${path}/:id`,
    route(async ({ body, params, user }) => {
      const { name } = namedSchema.parse(body);
      const doc = await Model.findOneAndUpdate(
        ownedBy(user, { _id: assertObjectId(params.id) }),
        { name },
        { new: true, runValidators: true }
      );
      return json(found(doc, label));
    })
  );

  router.delete(
    `${path}/:id`,
    route(async ({ params, user }) => {
      const doc = await Model.findOneAndDelete(ownedBy(user, { _id: assertObjectId(params.id) }));
      return json(found(doc, label));
    })
  );
}

// Customers and suppliers are validated by their own schema.
for (const [path, Model, schema, label] of [
  ['/customers', Customer, customerSchema, 'Customer'],
  ['/supplier', Supplier, supplierSchema, 'Supplier'],
]) {
  router.get(
    path,
    route(async ({ user }) => json(await Model.find(ownedBy(user)).sort({ createdAt: -1 })))
  );

  router.post(
    path,
    route(async ({ body, user }) => {
      const data = schema.parse(body);
      return json(await Model.create({ ...data, userId: user._id }), 201);
    })
  );

  router.put(
    `${path}/:id`,
    route(async ({ body, params, user }) => {
      const data = schema.parse(body);
      const doc = await Model.findOneAndUpdate(
        ownedBy(user, { _id: assertObjectId(params.id) }),
        data,
        { new: true, runValidators: true }
      );
      return json(found(doc, label));
    })
  );

  router.delete(
    `${path}/:id`,
    route(async ({ params, user }) => {
      const doc = await Model.findOneAndDelete(ownedBy(user, { _id: assertObjectId(params.id) }));
      return json(found(doc, label));
    })
  );
}

router.get(
  '/products',
  route(async ({ user }) => {
    const products = await Product.find(ownedBy(user))
      .populate(PRODUCT_REFS)
      .sort({ createdAt: -1 });
    return json(products);
  })
);

router.post(
  '/products',
  route(async ({ body, user }) => {
    const data = productSchema.parse(body);
    const product = await Product.create({ ...data, userId: user._id });
    return json(await product.populate(PRODUCT_REFS), 201);
  })
);

// Stock quantity is deliberately not editable here: it only changes through
// approved purchases and invoices.
router.put(
  '/products/:id',
  route(async ({ body, params, user }) => {
    const data = productSchema.parse(body);
    const product = await Product.findOneAndUpdate(
      ownedBy(user, { _id: assertObjectId(params.id) }),
      data,
      { new: true, runValidators: true }
    ).populate(PRODUCT_REFS);
    return json(found(product, 'Product'));
  })
);

router.delete(
  '/products/:id',
  route(async ({ params, user }) => {
    const product = await Product.findOneAndDelete(
      ownedBy(user, { _id: assertObjectId(params.id) })
    );
    return json(found(product, 'Product'));
  })
);

// A single product, e.g. to check its current stock.
router.get(
  '/productstock/:id',
  route(async ({ params, user }) => {
    const product = await Product.findOne(ownedBy(user, { _id: assertObjectId(params.id) }));
    return json(found(product, 'Product'));
  })
);

export default router;
