# Backend (Express API)

All server code is in `server/src`. It is plain JavaScript using ES modules
(`import`/`export`), which is why every relative import ends in `.js`.

## Startup

`index.js` does three things in order:

1. `assertConfig()` – stop immediately if `DB_URI` or `JWT_SECRET` is missing.
2. `dbConnect()` – connect Mongoose to MongoDB.
3. `app.listen()` – start accepting requests.

Environment variables are only read in `config.js`. Everything else imports `config`, so you
can see every setting in one file and nothing reads `process.env` by surprise.

## The Express app (`app.js`)

Middleware runs top to bottom for every request:

| Middleware         | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `helmet()`         | Security headers, including a Content Security Policy     |
| `morgan()`         | Logs each request (not in tests)                          |
| `express.json()`   | Parses JSON bodies into `req.body` (max 1 MB)             |
| `cookieParser()`   | Parses cookies into `req.cookies`                         |
| `rateLimit()`      | Limits login and sign-up attempts per IP                  |
| routers            | `/api` auth, `/api/admin`, `/api/ai`, `/api/user`         |
| `/api` 404 handler | Unknown API paths return `{ err: 'Not found' }`           |
| static files       | Serves the built React app if `client/dist` exists        |
| `errorHandler`     | Turns errors thrown outside handlers (bad JSON) into JSON |

## Routers

Routes are grouped by business area. `routes/user/index.js` mounts them all under
`/api/user`:

```js
router.use(account); // /profile, /change-password
router.use(billing); // /active/:id, /billing/:id, /orders, /pricing...
router.use(catalog); // /category, /unit, /customers, /supplier, /products...
router.use(invoices); // /invoice, /invoiceapprove, /invoicedetails/:id
router.use(payments); // /payment, /creditcustomer, /payment/:id/collect...
router.use(reports); // /dailyinvoicesreport, /stockreport...
router.use('/dashboard', dashboard);
router.use('/purchases', purchases);
router.use('/stock', stock); // /stock/movements, /stock/adjustments, /stock/low
```

The full list is in the [API reference](08-api-reference.md).

## The `route()` wrapper

Every handler is wrapped in `route()` from `lib/api.js`. It is the most important function
on the server:

```js
router.get(
  '/productstock/:id',
  route(async ({ params, user }) => {
    const product = await Product.findOne(ownedBy(user, { _id: assertObjectId(params.id) }));
    return json(found(product, 'Product'));
  })
);
```

Before your handler runs, `route()`:

1. Reads the session cookie and verifies the JWT → `user` (or **401 Please log in**).
2. Checks `user.role` is in `roles` (or **403 Forbidden**).
3. For shop users, checks there is an active subscription (or **402**).

Your handler receives `{ req, res, body, params, user }` and **returns** `json(data, status)`.
If it **throws**, `route()` turns the error into a JSON response:

| Thrown error                  | Status | Body example                                           |
| ----------------------------- | ------ | ------------------------------------------------------ |
| `new HttpError(400, 'msg')`   | 400    | `{ "err": "msg" }`                                     |
| zod validation failure        | 400    | `{ "err": "email: must be a valid email" }`            |
| Mongoose `CastError` (bad id) | 400    | `{ "err": "Invalid _id" }`                             |
| Duplicate key (unique index)  | 409    | `{ "err": "A record with this email already exists" }` |
| Anything else                 | 500    | `{ "err": "Something went wrong" }` (logged)           |

Options change the checks:

```js
route(handler, { auth: false }); // public: login, register
route(handler, { subscription: false }); // billing and account pages
route(handler, { roles: ['admin'] }); // admin only
```

Because errors are always `{ err }`, the client's `apiFetch()` can show any server message
directly to the user.

## Helpers you will use in every handler

```js
ownedBy(user, filter); // adds { userId: user._id } unless user is an admin
ownedMatch(user, filter); // the same for aggregation pipelines ($match needs ObjectIds)
assertObjectId(id, name); // 400 unless id is a valid ObjectId
found(doc, 'Product'); // 404 'Product not found' when doc is null, else returns doc
new HttpError(status, msg); // throw for any other expected failure
```

## Validation with zod

`lib/validators.js` defines a schema per request body. `schema.parse(body)` returns clean,
typed data (strings trimmed, numbers coerced, emails lower-cased) or throws a `ZodError` that
`route()` converts to a 400.

```js
export const collectPaymentSchema = z.object({
  amount: z.coerce.number().finite().positive('must be more than 0'),
  date: date.optional(),
});
```

Always validate before using `body`; never pass `body` straight to Mongoose.

## Models

Each file in `models/` defines one collection with a Mongoose schema. Records that belong to
a shop spread in `...owner`, which adds a required, indexed `userId`. `models/index.js`
re-exports every model; always import from there so `populate()` can find referenced models.

See the [data model](05-data-model.md) for every collection.

## Doing things safely when many requests run at once

Two people (or one double click) can hit the same endpoint at the same moment. The code
avoids "read, check, then write" races by making the **check part of the write**:

```js
// Only matches if there is enough stock; the decrement and the check are one operation.
Product.findOneAndUpdate(
  { _id: productId, quantity: { $gte: qty } },
  { $inc: { quantity: -qty } },
  { new: true }
);
```

If another request got there first, the filter no longer matches, `null` comes back, and the
handler reports an error instead of overselling. The same pattern guards purchase approval
(`status: false`), invoice approval and payment collection (`due_amount ≥ amount`).

MongoDB transactions would be the other option, but they need a replica set; this approach
works on a plain local MongoDB too.

## Performance

Measured with one shop holding 20,000 invoices among 21 shops:

| Technique                                                                    | Where                      | Effect                                                                         |
| ---------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| **Pagination** with `findPage()`                                             | invoice and purchase lists | `/payment` went from 14 MB to about 4 KB per page                              |
| **Fetch only what is shown**: `populate('customer_id', 'name')`, `.select()` | lists                      | Responses stop carrying whole linked records                                   |
| **`.lean()`** on read-only queries                                           | lists                      | Plain objects, skipping the cost of building Mongoose documents                |
| **Compound indexes** such as `{ userId, createdAt }`                         | `models/`                  | Filter and sort are served by the index, without scanning or sorting in memory |
| **`$nin` on pending invoices** rather than a `$lookup` per row               | dashboard, receivables     | Pending invoices are few, so the exclusion list stays short                    |
| **gzip** with `compression()`                                                | `app.js`                   | Smaller JSON and JavaScript on the wire                                        |

Choosing an index: put equality fields first, then the sort or range field. For
`find({ userId, status }).sort({ date: -1 })` that means `{ userId: 1, status: 1, date: -1 }`.
Each index also slows writes slightly and uses memory, so add them for real queries only.
MongoDB builds new indexes when the server starts.

To see what a query does, use `explain`:

```js
await Payment.find({ userId }).sort({ createdAt: -1 }).limit(10).explain('executionStats');
// Look for IXSCAN (good) vs COLLSCAN (full scan), and totalDocsExamined vs nReturned.
```

## Logging

- `morgan` logs one line per request.
- Unexpected errors are logged with `console.error` in `lib/api.js` and returned as a
  generic 500, so internal details never reach the browser.
