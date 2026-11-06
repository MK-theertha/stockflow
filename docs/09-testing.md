# Testing

```bash
npm test          # from the repo root
```

The API tests live in `server/tests` and use:

- **`node:test`**, Node's built-in test runner (no Jest/Mocha needed)
- **supertest**, which sends real HTTP requests to the Express app without opening a port
- **mongodb-memory-server**, which starts a throwaway MongoDB per test file. The first run
  downloads MongoDB (~70 MB) once; after that it is cached.

Tests never touch your real database.

## What is covered

| File                | Covers                                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.test.js`      | sign-up, login, logout, session, wrong password, 401/402/403 rules, profile, password change                                                                      |
| `inventory.test.js` | purchase approval, invoice approval, not-enough-stock rollback, stock ledger, adjustments, low stock, shop isolation, server-computed totals, reversals on delete |
| `payments.test.js`  | collecting payments, over-collection, pending invoices excluded, isolation, dashboard numbers                                                                     |
| `expenses.test.js`  | expense CRUD, validation, isolation, dashboard total                                                                                                              |

These focus on the rules that would cost real money if they broke: stock counts, payment
balances, and one shop seeing another's data.

## Anatomy of a test

```js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createProduct, loginAs, stockUp, useTestApp } from './helpers.js';

const ctx = useTestApp(); // in-memory DB + app, wiped before every test

const quantityOf = async (agent, product) =>
  (await agent.get(`/api/user/productstock/${product._id}`).expect(200)).body.quantity;

describe('inventory', () => {
  it('adds stock when a purchase is approved, only once', async () => {
    const { agent } = await loginAs(ctx.app); // a subscribed shop, logged in
    const product = await createProduct(agent);
    const { purchase } = await stockUp(agent, product, 10);

    assert.equal(await quantityOf(agent, product), 10);
    await agent.put(`/api/user/purchases/${purchase._id}`).expect(400); // second approval
    assert.equal(await quantityOf(agent, product), 10); // unchanged
  });
});
```

`agent` is a supertest agent: it keeps cookies between requests, just like a browser, so
after `loginAs` every request is authenticated.

### Helpers (`tests/helpers.js`)

| Helper                               | Does                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `useTestApp()`                       | Starts MongoDB + app for the file, clears data between tests |
| `loginAs(app, { role, subscribed })` | Creates a user and returns a logged-in `agent`               |
| `createProduct(agent, fields)`       | Creates a product through the API                            |
| `stockUp(agent, product, qty)`       | Creates and approves a purchase                              |
| `createInvoice(agent, {...})`        | Creates a pending invoice for a new customer                 |

## Writing a new test

1. Create `server/tests/<area>.test.js` (the `.test.js` suffix is how it is found).
2. Call `const ctx = useTestApp();` at the top.
3. Arrange with the helpers, act with `agent.<method>(url).send(body).expect(status)`,
   assert on `body`.
4. Always add an isolation test for new shop data: create with shop A, check shop B gets
   an empty list and 404s.

## CI

`.github/workflows/ci.yml` runs on every push and pull request:

```
npm ci → format:check → lint → test → build
```

A red build means one of these failed; run the same command locally to see why.
