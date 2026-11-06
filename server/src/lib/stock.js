import { Product, StockMovement } from '../models/index.js';

/**
 * The only place that changes Product.quantity. Adds `quantity` (negative to
 * remove) atomically and writes a row to the stock ledger.
 *
 * Returns the updated product, or null when the product does not match
 * `filter` or does not have enough stock to remove `quantity`.
 */
export async function changeStock({ productId, quantity, type, reference, note, filter = {} }) {
  const enoughStock = quantity < 0 ? { quantity: { $gte: -quantity } } : {};

  const product = await Product.findOneAndUpdate(
    { ...filter, _id: productId, ...enoughStock },
    { $inc: { quantity } },
    { new: true }
  );
  if (!product) return null;

  await StockMovement.create({
    userId: product.userId,
    product_id: product._id,
    type,
    quantity,
    balance: product.quantity,
    reference,
    note,
  });
  return product;
}

/** Undoes changeStock() calls made for `reference`, e.g. when an invoice approval fails halfway. */
export async function revertStock(reference, changes) {
  await Promise.all(
    changes.map(([productId, quantity]) =>
      Product.updateOne({ _id: productId }, { $inc: { quantity: -quantity } })
    )
  );
  await StockMovement.deleteMany({ reference });
}
