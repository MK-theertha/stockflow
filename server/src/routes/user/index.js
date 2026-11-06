import { Router } from 'express';

import account from './account.js';
import billing from './billing.js';
import catalog from './catalog.js';
import dashboard from './dashboard.js';
import expenses from './expenses.js';
import invoices from './invoices.js';
import payments from './payments.js';
import purchases from './purchases.js';
import reports from './reports.js';
import stock from './stock.js';

// Everything under /api/user. Admins may call these too and see every shop's records.
const router = Router();

router.use(account);
router.use(billing);
router.use(catalog);
router.use(invoices);
router.use(payments);
router.use(reports);
router.use('/dashboard', dashboard);
router.use('/expenses', expenses);
router.use('/purchases', purchases);
router.use('/stock', stock);

export default router;
