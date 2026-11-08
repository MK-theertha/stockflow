import { Router } from 'express';
import mongoose from 'mongoose';

import {
  HttpError,
  assertObjectId,
  found,
  json,
  ownedBy,
  roundMoney,
  route,
} from '../../lib/api.js';
import { approveInvoice, deleteInvoiceRecords } from '../../lib/invoices.js';
import { changeStock } from '../../lib/stock.js';
import { invoiceSchema } from '../../lib/validators.js';
import {
  Customer,
  Invoice,
  InvoiceDetail,
  Payment,
  PaymentDetail,
  Product,
} from '../../models/index.js';

const generateInvoiceNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const uniquePart = new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase();
  return `INV-${datePart}-${uniquePart}`;
};

const paymentAmounts = (status, total, partial) => {
  if (status === 'full_paid') return { paid: total, due: 0 };
  if (status === 'full_due') return { paid: 0, due: total };
  return { paid: partial, due: total - partial };
};

const router = Router();

router.get(
  '/invoice',
  route(async ({ user }) => {
    const invoices = await Invoice.find(ownedBy(user)).sort({ createdAt: -1 });
    return json(invoices);
  })
);

// Creates a pending invoice with its line items and payment record.
// Stock is only deducted once the invoice is approved.
router.post(
  '/invoice',
  route(async ({ body, user }) => {
    const input = invoiceSchema.parse(body);
    const userId = user._id;

    const productIds = [...new Set(input.purchaseData.map((line) => line.selectedProduct))];
    const products = await Product.find({ _id: { $in: productIds }, userId });
    if (products.length !== productIds.length) {
      throw new HttpError(400, 'Unknown product in invoice');
    }
    const productsById = new Map(products.map((product) => [String(product._id), product]));

    // Totals are always computed here, never taken from the browser.
    const lines = input.purchaseData.map((line) => ({
      ...line,
      totalPrice: roundMoney(line.quantity * line.unitPrice),
    }));
    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.totalPrice, 0));
    if (input.discount > subtotal)
      throw new HttpError(400, 'Discount cannot be more than the total');
    const grandTotal = roundMoney(subtotal - input.discount);
    if (input.status === 'partial_paid' && input.partialAmount > grandTotal) {
      throw new HttpError(400, 'Paid amount cannot be more than the grand total');
    }

    let customerId = input.selectedCustomer;
    if (customerId === 'new_customer') {
      const customer = await Customer.create({
        userId,
        name: input.name,
        email: input.email,
        mobileNumber: input.phone,
      });
      customerId = customer._id;
    } else {
      found(await Customer.exists({ _id: customerId, userId }), 'Customer');
    }

    const invoice = await Invoice.create({
      userId,
      invoice_no: generateInvoiceNumber(),
      date: input.date,
      description: input.description,
      status: false,
    });

    try {
      const { paid, due } = paymentAmounts(input.status, grandTotal, input.partialAmount);

      await InvoiceDetail.insertMany(
        lines.map((line) => ({
          userId,
          invoice_id: invoice._id,
          product_id: line.selectedProduct,
          category_id:
            line.selectedCategory ?? productsById.get(line.selectedProduct).categoryNameId,
          date: line.startDate ?? input.date,
          selling_qty: line.quantity,
          unit_price: line.unitPrice,
          selling_price: line.totalPrice,
          status: true,
        }))
      );
      await Payment.create({
        userId,
        invoice_id: invoice._id,
        customer_id: customerId,
        paid_status: input.status,
        discount_amount: input.discount,
        total_amount: grandTotal,
        paid_amount: paid,
        due_amount: due,
        invoice_date: input.date,
        approved: false,
      });
      await PaymentDetail.create({
        userId,
        invoice_id: invoice._id,
        current_paid_amount: paid,
        date: input.date,
      });
    } catch (err) {
      // No multi-document transaction on a standalone MongoDB, so undo by hand.
      await deleteInvoiceRecords(invoice._id);
      throw err;
    }

    return json(invoice, 201);
  })
);

// Deletes an invoice with its lines and payments. If it was approved, the sold
// quantities go back into stock through the ledger.
router.delete(
  '/invoice/:id',
  route(async ({ params, user }) => {
    // Delete first so two simultaneous deletes cannot both return the stock.
    const invoice = found(
      await Invoice.findOneAndDelete(ownedBy(user, { _id: assertObjectId(params.id) })),
      'Invoice'
    );

    if (invoice.status) {
      const lines = await InvoiceDetail.find({ invoice_id: invoice._id });
      for (const line of lines) {
        await changeStock({
          productId: line.product_id,
          quantity: line.selling_qty,
          type: 'reversal',
          reference: invoice._id,
          note: `Invoice ${invoice.invoice_no} deleted`,
        });
      }
    }

    await deleteInvoiceRecords(invoice._id);
    return json(invoice);
  })
);

// Quantities are always read from the database, never from the request body.
router.post(
  '/invoiceapprove',
  route(async ({ body, user }) => {
    const { invoiceId } = body;
    await approveInvoice(ownedBy(user, { _id: assertObjectId(invoiceId, 'invoiceId') }));
    return json({ success: true, message: 'Invoice approved and stock updated successfully.' });
  })
);

// Everything needed to show or print one invoice.
router.get(
  '/invoicedetails/:id',
  route(async ({ params, user }) => {
    const invoice = await Invoice.find(ownedBy(user, { _id: assertObjectId(params.id) }));
    const invoiceId = invoice[0]?._id;
    if (!invoiceId) {
      return json({ invoice: [], invoicedetails: [], payment: [], paymentDetails: [] });
    }

    const [invoicedetails, payment, paymentDetails] = await Promise.all([
      InvoiceDetail.find({ invoice_id: invoiceId }).populate(['category_id', 'product_id']),
      Payment.find({ invoice_id: invoiceId }).populate('customer_id'),
      PaymentDetail.find({ invoice_id: invoiceId }),
    ]);
    return json({ invoice, invoicedetails, payment, paymentDetails });
  })
);

export default router;
