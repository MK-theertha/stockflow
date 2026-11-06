# StockFlow

A small **ERP** for shops: purchasing, inventory with a full stock ledger, invoicing,
receivables, expenses and a KPI dashboard. Built on the **MERN** stack (MongoDB, Express,
React, Node.js) as a learning project.

Each registered user is a shop with its own private data. Shops pay for access through
Stripe; a platform admin can see every shop.

## Features

| Area         | What you can do                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Dashboard    | Sales today and this month, receivables, pending approvals, 6-month sales chart, best sellers, low stock |
| Master data  | Products (with reorder levels), categories, units, suppliers, customers                                  |
| Purchasing   | Record purchases, approve them to add stock; record running expenses                                     |
| Sales        | Create invoices for new or existing customers, approve them to deduct stock, print                       |
| Receivables  | See who owes money, collect full or partial payments, view payment history                               |
| Inventory    | Stock ledger of every movement, manual adjustments with reasons, low-stock alerts                        |
| Reports      | Stock, daily sales, daily purchases, by supplier or category                                             |
| Account      | Profile with photo, change password                                                                      |
| Subscription | Stripe checkout, plan status, payment history                                                            |
| Admin        | Platform totals, list of shops with subscription status, read-only views of all data                     |
| AI assistant | Ask Google Gemini questions from the dashboard                                                           |

## Quick start

Requirements: **Node.js 20.6+** and a **MongoDB** server (local or Atlas).

```bash
npm install
cp server/.env.example server/.env    # set DB_URI and JWT_SECRET at least
cp client/.env.example client/.env    # optional: Cloudinary for photos
npm run dev
```

Open **http://localhost:5173** and register. A new shop needs an active subscription to use
the dashboard; for local testing without Stripe you can insert one directly:

```js
// mongosh, in your database
db.subscriptions.insertOne({
  userId: db.users.findOne({ email: 'you@example.com' })._id,
  stripesubscriptionId: 'local-dev',
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 864e5),
  price: 0,
});
```

To make an admin, set `role: 'admin'` on a user.

## Scripts

Run from the repository root:

| Command                                        | What it does                                                    |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                                  | API on :5050 and React dev server on :5173, both auto-reloading |
| `npm test`                                     | API tests against an in-memory MongoDB                          |
| `npm run lint`                                 | ESLint                                                          |
| `npm run format`                               | Format everything with Prettier                                 |
| `npm run build`                                | Build the React app into `client/dist`                          |
| `npm start`                                    | Serve the API and the built app from one server (production)    |
| `npm run db:assign-owner -- owner@example.com` | Give records from an old database an owner                      |

## Project structure

```
client/                 React app (Vite, React Router, MUI, Redux Toolkit)
  src/app/              routes, sidebar menus, providers, theme
  src/components/       shared UI: DataTable, CrudPage, DashboardShell...
  src/features/         one folder per business area (sales, inventory, receivables...)
server/                 Express API (Mongoose, zod, JWT cookies)
  src/routes/           endpoints grouped by business area
  src/lib/              route() wrapper, auth, validation, stock and invoice logic
  src/models/           MongoDB collections
  tests/                API tests
shared/                 code used by both sides (plan prices, expense categories)
docs/                   architecture and learning guides
```

## Documentation

Start with **[docs/README.md](docs/README.md)**. It has a reading order covering ERP
concepts, architecture diagrams, backend and frontend guides, the data model, business
flows, security, the full API reference, testing, and a step-by-step tutorial for adding
a feature.

## Configuration

| File          | Holds                                                                |
| ------------- | -------------------------------------------------------------------- |
| `server/.env` | `DB_URI`, `JWT_SECRET`, Stripe and Gemini keys, `CLIENT_URL`, `PORT` |
| `client/.env` | `VITE_*` values only. These are public, so never put secrets here.   |

See the `.env.example` next to each file for every option.

## Tech stack

**Frontend:** React 18, Vite, React Router 6, MUI 5, Redux Toolkit, Chart.js
**Backend:** Node.js, Express 4, Mongoose 8, zod, JWT, bcrypt, helmet, express-rate-limit
**Services:** MongoDB, Stripe, Google Gemini, Cloudinary
**Tooling:** npm workspaces, ESLint, Prettier, node:test, supertest, GitHub Actions
