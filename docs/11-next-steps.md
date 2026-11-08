# Ideas for next steps

Features that real ERPs have, roughly ordered from easiest to hardest. Each teaches
something new. Use the [tutorial](10-adding-a-feature.md) checklist for each.

## Business features

| Feature                 | What it involves                                                                                 | You will learn                     |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| **Product prices**      | `costPrice` and `sellingPrice` on products; prefill invoice lines; stock value on the dashboard  | Schema changes, derived values     |
| **Profit report**       | Sales − cost of goods sold − expenses per month                                                  | Bigger aggregation pipelines       |
| **Accounts payable**    | Track what you owe suppliers per purchase and record payments to them                            | Mirroring an existing module       |
| **Sales returns**       | A return document that puts stock back (`changeStock`, type `return`) and reduces the amount due | Reversing transactions properly    |
| **Purchase orders**     | Order → receive (partially) → bill, instead of one purchase step                                 | Multi-step document workflows      |
| **Taxes (GST)**         | Tax rate per product, tax lines on invoices, a tax report                                        | Money rounding, reports            |
| **Barcodes**            | `sku`/`barcode` on products, scan to add invoice lines                                           | Browser APIs, unique indexes       |
| **Multiple warehouses** | Stock per product **per location**, transfers between them                                       | Remodelling a core concept         |
| **Staff accounts**      | Users inside a shop with roles (cashier can invoice but not delete)                              | Permission design                  |
| **Audit log**           | Record who created/approved/deleted what and when                                                | Cross-cutting concerns, middleware |
| **Email invoices**      | Send a PDF invoice to the customer                                                               | Background jobs, PDF generation    |

## Making the existing code better

- **Paginate the remaining lists** (products, customers, expenses, receivables). Invoices and
  purchases already use `findPage()` and `usePagedApi()`.
- **Store the invoice date and approval status on `Payment`** (denormalisation), so dashboard
  sales need no `$lookup`. This is the slowest remaining query; the trade-off is keeping two
  copies in sync.
- **Restyle the public pages** (home, login, register, pricing) with the same theme and
  components as the dashboard.
- **Invoice editing.** Today a pending invoice can only be deleted and re-created; an edit
  form (reusing `LineItemsEditor`) is a good exercise.
- **Use MongoDB transactions** for invoice creation and approval once you run a replica set
  (MongoDB Atlas does by default), replacing the manual rollback code.
- **Rename the legacy fields** (`supplierNameId` → `supplierId`, `Purchases` → `Purchase`)
  with a migration script like `server/scripts/migrate-assign-owner.mjs`.
- **TypeScript**, starting with `shared/` and the API response types.
- **Frontend tests** with Vitest + React Testing Library for `CrudPage` and the dialogs.
- **Password reset by email** and email verification.

## Deploying

A simple production setup:

1. Create a MongoDB Atlas cluster and copy its connection string.
2. Deploy the repo to a Node host (Render, Railway, Fly.io…) with:
   - build command: `npm ci && npm run build`
   - start command: `npm start`
   - environment: everything in `server/.env.example`, with `NODE_ENV=production` and
     `CLIENT_URL` set to your public URL
3. Set `TRUST_PROXY=true` if the host puts a proxy in front (most do), so rate limiting
   sees real client IPs.
