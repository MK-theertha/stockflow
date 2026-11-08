import { Invoice, Payment } from '../models/index.js';

/**
 * Payments created before `invoice_date` and `approved` were added do not have them.
 * Copies them from each payment's invoice. Runs at startup; once every payment has the
 * fields this is a single indexed query that finds nothing.
 *
 * Returns how many payments were updated.
 */
export async function backfillPaymentInvoiceFields() {
  const missing = await Payment.find({ approved: { $exists: false } })
    .select('invoice_id')
    .lean();
  if (missing.length === 0) return 0;

  const invoices = await Invoice.find({ _id: { $in: missing.map((p) => p.invoice_id) } })
    .select('date status')
    .lean();
  const byId = new Map(invoices.map((invoice) => [String(invoice._id), invoice]));

  await Payment.bulkWrite(
    missing.map((payment) => {
      const invoice = byId.get(String(payment.invoice_id));
      return {
        updateOne: {
          filter: { _id: payment._id },
          update: { $set: { invoice_date: invoice?.date, approved: invoice?.status ?? false } },
        },
      };
    })
  );
  return missing.length;
}
