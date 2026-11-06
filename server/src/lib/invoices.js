import { HttpError, found } from './api.js';
import { changeStock, revertStock } from './stock.js';
import { Invoice, InvoiceDetail, Payment, PaymentDetail } from '../models/index.js';

export const deleteInvoiceRecords = (invoiceId) =>
  Promise.all([
    Invoice.deleteOne({ _id: invoiceId }),
    InvoiceDetail.deleteMany({ invoice_id: invoiceId }),
    Payment.deleteMany({ invoice_id: invoiceId }),
    PaymentDetail.deleteMany({ invoice_id: invoiceId }),
  ]);

/**
 * Approves a pending invoice and deducts its items from stock.
 * Either every product has enough stock and all are deducted, or nothing changes.
 */
export async function approveInvoice(filter) {
  const pending = found(await Invoice.findOne(filter), 'Invoice');
  if (pending.status) throw new HttpError(400, 'Invoice already approved');

  // Claim the invoice first so two concurrent approvals cannot both deduct stock.
  const invoice = await Invoice.findOneAndUpdate(
    { ...filter, status: false },
    { status: true },
    { new: true }
  );
  if (!invoice) throw new HttpError(400, 'Invoice already approved');

  const lines = await InvoiceDetail.find({ invoice_id: invoice._id }).populate('product_id');
  const quantities = new Map();
  for (const line of lines) {
    const id = line.product_id?._id.toString();
    if (!id) {
      await Invoice.updateOne({ _id: invoice._id }, { status: false });
      throw new HttpError(400, 'Invoice contains a product that no longer exists');
    }
    quantities.set(id, (quantities.get(id) ?? 0) + line.selling_qty);
  }

  const deducted = [];
  try {
    for (const [productId, qty] of quantities) {
      const product = await changeStock({
        productId,
        quantity: -qty,
        type: 'sale',
        reference: invoice._id,
        note: `Invoice ${invoice.invoice_no}`,
      });
      if (!product) {
        const name = lines.find((line) => line.product_id._id.toString() === productId).product_id
          .productName;
        throw new HttpError(400, `Not enough stock for ${name}`);
      }
      deducted.push([productId, -qty]);
    }
  } catch (err) {
    await revertStock(invoice._id, deducted);
    await Invoice.updateOne({ _id: invoice._id }, { status: false });
    throw err;
  }

  return invoice;
}
