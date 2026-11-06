# API reference

All endpoints take and return JSON. Errors always look like `{ "err": "message" }`.

**Access** column:

- **public**: no login needed
- **login**: any logged-in user, subscription not needed
- **shop**: logged-in shop with an active subscription, or an admin (admins see every shop's
  records)
- **admin**: admins only

Unless noted, list endpoints return an array sorted newest first, and `:id` must be a valid
MongoDB ObjectId (400 otherwise).

## Auth and account

| Method | Path                        | Access | Body / notes                                                                  |
| ------ | --------------------------- | ------ | ----------------------------------------------------------------------------- |
| POST   | `/api/register`             | public | `{ name, email, password, phone? }` → 201. Rate limited.                      |
| POST   | `/api/auth/login`           | public | `{ email, password }` → `{ user }` and sets the session cookie. Rate limited. |
| POST   | `/api/auth/logout`          | public | Clears the session cookie.                                                    |
| GET    | `/api/auth/session`         | public | `{ user }`, or `{ user: null }` when logged out.                              |
| GET    | `/api/user/profile`         | login  | The full user record (without password).                                      |
| PUT    | `/api/user/profile`         | login  | `{ name, phone?, image? }`. Refreshes the session cookie.                     |
| POST   | `/api/user/change-password` | login  | `{ oldPassword, newPassword }`. 400 if the old password is wrong.             |

## Subscription

| Method | Path                                   | Access | Notes                                                                    |
| ------ | -------------------------------------- | ------ | ------------------------------------------------------------------------ |
| POST   | `/api/user/active/:userId`             | login  | 200 if the subscription is active, 402 if not.                           |
| GET    | `/api/user/billing/:userId`            | login  | The subscription (own, or any for admins).                               |
| GET    | `/api/user/orders`                     | login  | Stripe payments made by this user.                                       |
| POST   | `/api/user/pricing`                    | login  | `{ plan, billingPeriod: 'monthly' \| 'annual' }` → `{ id: checkoutUrl }` |
| GET    | `/api/user/pricing/success/:sessionId` | login  | Verifies a Stripe checkout and extends the subscription. Idempotent.     |

## Master data

These six resources share the same shape:

| Method | Path                       | Access | Notes                       |
| ------ | -------------------------- | ------ | --------------------------- |
| GET    | `/api/user/<resource>`     | shop   | List                        |
| POST   | `/api/user/<resource>`     | shop   | Create → 201                |
| PUT    | `/api/user/<resource>/:id` | shop   | Replace the editable fields |
| DELETE | `/api/user/<resource>/:id` | shop   | Delete, returns the record  |

| `<resource>` | Body                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `category`   | `{ name }`                                                                                                                   |
| `unit`       | `{ name }`                                                                                                                   |
| `supplier`   | `{ name, email, phone, address }`; email unique per shop (409)                                                               |
| `customers`  | `{ name, email, mobileNumber, address?, image? }`; email unique per shop (409)                                               |
| `products`   | `{ productName, supplierNameId?, unitNameId?, categoryNameId?, reorderLevel? }`. Returned populated. Quantity cannot be set. |
| `expenses`   | `{ date, category, amount, paidTo?, note? }`; category from `shared/expenses.js`                                             |

| Method | Path                         | Returns                             |
| ------ | ---------------------------- | ----------------------------------- |
| GET    | `/api/user/productstock/:id` | One product, e.g. its current stock |

## Purchasing

| Method | Path                      | Access | Notes                                                                                                                                                                                                                                                                  |
| ------ | ------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/user/purchases`     | shop   | Populated with supplier, category, product.                                                                                                                                                                                                                            |
| POST   | `/api/user/purchases`     | shop   | Array of `{ purchaseNo, supplierName, selectedProduct, startDate, quantity, unitPrice, selectedCategory?, description? }`. Product and supplier must belong to the shop. The total is computed on the server; the category defaults to the product's. Created pending. |
| PUT    | `/api/user/purchases/:id` | shop   | **Approve**: adds stock, writes a ledger row. 400 if already approved.                                                                                                                                                                                                 |
| DELETE | `/api/user/purchases/:id` | shop   | Delete. If approved, the stock is taken back out with a `reversal` ledger row; 400 if that stock has already been sold.                                                                                                                                                |

## Sales

| Method | Path                           | Access | Notes                                                                                                                                                                                                                                                                                                                                                 |
| ------ | ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/user/invoice`            | shop   | Invoices.                                                                                                                                                                                                                                                                                                                                             |
| POST   | `/api/user/invoice`            | shop   | `{ date, status, selectedCustomer, purchaseData: [{ selectedProduct, quantity, unitPrice }], discount?, partialAmount?, description?, name?, email?, phone? }`. `selectedCustomer: 'new_customer'` creates the customer from name/email/phone. **Totals are computed on the server**; any `grandTotal`/`totalPrice` sent is ignored. Created pending. |
| DELETE | `/api/user/invoice/:id`        | shop   | Deletes the invoice, lines and payments. If approved, the items go back into stock (`reversal` ledger rows).                                                                                                                                                                                                                                          |
| POST   | `/api/user/invoiceapprove`     | shop   | `{ invoiceId }`. **Approve**: deducts stock all-or-nothing.                                                                                                                                                                                                                                                                                           |
| GET    | `/api/user/invoicedetails/:id` | shop   | `{ invoice, invoicedetails, payment, paymentDetails }` for the invoice page.                                                                                                                                                                                                                                                                          |

## Payments and receivables

| Method | Path                            | Access | Notes                                                                             |
| ------ | ------------------------------- | ------ | --------------------------------------------------------------------------------- |
| GET    | `/api/user/payment`             | shop   | One payment per invoice, with invoice and customer. Used for the invoice lists.   |
| GET    | `/api/user/creditcustomer`      | shop   | Receivables: **approved** invoices with money due.                                |
| GET    | `/api/user/paidcustomer`        | shop   | Approved invoices paid in full.                                                   |
| POST   | `/api/user/payment/:id/collect` | shop   | `{ amount, date? }`. 400 if more than due, or if the invoice is not approved yet. |
| GET    | `/api/user/payment/:id/history` | shop   | Every amount received for that invoice, oldest first.                             |

## Inventory

| Method | Path                          | Access | Notes                                                       |
| ------ | ----------------------------- | ------ | ----------------------------------------------------------- |
| GET    | `/api/user/stock/movements`   | shop   | Stock ledger, newest first, max 200. `?productId=` filters. |
| POST   | `/api/user/stock/adjustments` | shop   | `{ productId, quantity (non-zero int), note }` → 201        |
| GET    | `/api/user/stock/low`         | shop   | Products at or below their reorder level.                   |

## Reports and dashboard

| Method | Path                                  | Access | Notes                                                                                     |
| ------ | ------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| GET    | `/api/user/dashboard`                 | shop   | All dashboard KPIs in one object (see below).                                             |
| GET    | `/api/user/stockreport`               | shop   | Products with category.                                                                   |
| POST   | `/api/user/dailyinvoicesreport`       | shop   | `{ startDate, endDate }` → invoices in range, each with its `payment` (totals, customer). |
| POST   | `/api/user/dailypurchasereport`       | shop   | `{ startDate, endDate }` → purchases in range.                                            |
| GET    | `/api/user/supplierproductwisereport` | shop   | `{ supplier: [...], category: [...] }` filter options.                                    |
| POST   | `/api/user/getReportData`             | shop   | `{ reportType: 'supplier' \| 'category', name: id }` → products.                          |

Dashboard response shape:

```json
{
  "sales": {
    "today": { "total": 500, "invoices": 1 },
    "thisMonth": { "total": 500, "invoices": 1 }
  },
  "purchases": { "thisMonth": { "total": 2400, "purchases": 3 } },
  "expenses": { "thisMonth": { "total": 15000 } },
  "receivables": { "total": 400, "invoices": 2 },
  "counts": {
    "products": 3,
    "customers": 2,
    "suppliers": 1,
    "pendingInvoices": 1,
    "pendingPurchases": 0
  },
  "salesTrend": [{ "month": "Jun 2026", "total": 0, "invoices": 0 }, "..."],
  "topProducts": [{ "_id": "...", "productName": "Rice", "quantity": 5, "revenue": 500 }],
  "lowStock": ["...products"],
  "recentPayments": ["...payments with invoice and customer"]
}
```

## Admin

| Method | Path               | Access | Notes                                                           |
| ------ | ------------------ | ------ | --------------------------------------------------------------- |
| GET    | `/api/admin`       | admin  | Record counts per collection across all shops.                  |
| GET    | `/api/admin/shops` | admin  | Every shop with subscription status and product/invoice counts. |

## AI assistant

| Method | Path      | Access | Notes                                                  |
| ------ | --------- | ------ | ------------------------------------------------------ |
| POST   | `/api/ai` | login  | `{ prompt }` (max 4000 chars) → `{ text }` from Gemini |

## Status codes

| Code | Meaning in this API                                      |
| ---- | -------------------------------------------------------- |
| 200  | OK                                                       |
| 201  | Created                                                  |
| 400  | Invalid input, or a business rule said no                |
| 401  | Not logged in                                            |
| 402  | Subscription not active                                  |
| 403  | Logged in but not allowed                                |
| 404  | Not found (or belongs to another shop)                   |
| 409  | Duplicate (e.g. email already used)                      |
| 429  | Too many login / sign-up attempts                        |
| 500  | Unexpected server error (details only in the server log) |
