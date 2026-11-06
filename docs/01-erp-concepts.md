# ERP concepts

ERP software runs the day-to-day operations of a business. Large ERPs (SAP, Odoo, ERPNext)
have dozens of modules; StockFlow implements the core of four of them. Understanding these
ideas first makes the code much easier to follow.

## The modules in StockFlow

| Module          | Question it answers                         | Where in the code                                                    |
| --------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| **Master data** | What do we sell, to whom, bought from whom? | `features/catalog`, `features/customers`                             |
| **Purchasing**  | What did we order from suppliers?           | `features/purchases`, `routes/user/purchases.js`                     |
| **Inventory**   | How much of each product do we have?        | `features/inventory`, `routes/user/stock.js`, `lib/stock.js`         |
| **Sales**       | What did we sell, to whom, for how much?    | `features/sales`, `routes/user/invoices.js`, `lib/invoices.js`       |
| **Receivables** | Who still owes us money?                    | `features/receivables`, `routes/user/payments.js`                    |
| **Reporting**   | How is the business doing?                  | `features/dashboard`, `features/reports`, `routes/user/dashboard.js` |

## Key ideas

### Master data vs. transactions

- **Master data** changes rarely and describes _things_: products, customers, suppliers,
  categories, units.
- **Transactions** record _events_: a purchase, an invoice, a payment, a stock adjustment.
  Transactions point at master data (an invoice line points at a product).

A good rule: master data can be edited; transactions should be **corrected with a new
transaction**, not edited, so history stays truthful. In StockFlow, deleting an approved
purchase or invoice adds a **reversal** row to the stock ledger rather than erasing what
happened.

### Draft → approved (posting)

Real accounting systems separate _creating_ a document from _posting_ it. StockFlow does the
same:

- A purchase is created as **pending** (`status: false`). Stock changes only when it is
  **approved**.
- An invoice is created as **pending**. Stock is deducted only when it is **approved**.

This gives a shop owner a chance to check documents before they affect the books, and it is
why approval endpoints must be safe to call twice (see
[Business flows](06-business-flows.md#why-approvals-cant-run-twice)).

### The stock ledger

`Product.quantity` tells you _how much_ you have, but not _why_. The **stock ledger**
(`StockMovement` collection) records every change:

| Date  | Product | Type       | Change | Balance |
| ----- | ------- | ---------- | ------ | ------- |
| 1 Nov | Rice    | purchase   | +40    | 40      |
| 3 Nov | Rice    | sale       | −5     | 35      |
| 4 Nov | Rice    | adjustment | −2     | 33      |

The ledger is **append-only**: rows are never edited. If you add up the `Change` column for a
product you get its current quantity. This is the same idea as a bank statement, and it is how
every serious inventory system works.

### Stock adjustments

Real stock drifts from the computer: goods get damaged, expire, are stolen, or are miscounted.
An **adjustment** corrects the quantity and records a reason, so the difference is explained
instead of silently overwritten.

### Reorder level

Each product can have a **reorder level**. When stock falls to or below it, the product shows
up under _Low stock_ and on the dashboard, telling you to buy more before you run out.

### Accounts receivable

When a customer does not pay the full invoice immediately, the unpaid part is a
**receivable**: money owed to the business. StockFlow tracks, per invoice:

- `total_amount`, `paid_amount`, `due_amount`
- `paid_status`: `full_paid`, `partial_paid` or `full_due`
- every individual payment received (`PaymentDetail` rows)

_Collecting a payment_ moves money from `due_amount` to `paid_amount` and records the
receipt.

### Multi-tenancy

StockFlow is **SaaS**: many shops share one database, and each must only see its own data.
Every business record carries a `userId` (the owning shop), and every query is filtered by it.
See [Security](07-security.md#multi-tenancy-every-shop-sees-only-its-own-data).

## Glossary

| Term           | Meaning                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| SKU / product  | One kind of item you stock and sell                                         |
| Unit           | How a product is counted: kg, box, piece                                    |
| Purchase       | Goods bought from a supplier                                                |
| Invoice        | A bill to a customer for goods sold                                         |
| Approve / post | Make a document final so it changes stock or balances                       |
| Ledger         | An append-only list of changes with a running balance                       |
| Receivable     | Money customers owe you                                                     |
| Payable        | Money you owe suppliers (not built yet, see [next steps](11-next-steps.md)) |
| Reorder level  | Stock level that triggers a "buy more" warning                              |
| Tenant         | One customer of a SaaS product; here, one shop                              |
| KPI            | Key performance indicator: a number that shows how the business is doing    |
