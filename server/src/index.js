import app from './app.js';
import { assertConfig, config } from './config.js';
import { backfillPaymentInvoiceFields } from './lib/backfill.js';
import dbConnect from './lib/db.js';

try {
  assertConfig();
  await dbConnect();

  const backfilled = await backfillPaymentInvoiceFields();
  if (backfilled) console.warn(`Filled in invoice date and status on ${backfilled} payments`);

  app.listen(config.port, () => console.warn(`API listening on http://localhost:${config.port}`));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
