# Security

A summary of how StockFlow protects accounts and data, and why each choice was made.

## Authentication: who are you?

1. `POST /api/auth/login` looks up the user by email and checks the password with
   `bcrypt.compare` (passwords are stored as bcrypt hashes, never in plain text).
2. Unknown email and wrong password return the **same** message, so the login form cannot
   be used to discover which emails have accounts.
3. On success the server signs a **JWT** containing a small user summary
   (`_id`, `name`, `email`, `role`, …) and sends it as a cookie:

```js
res.cookie('stockflow_session', token, {
  httpOnly: true, // JavaScript in the page cannot read it
  sameSite: 'lax', // not sent on cross-site POSTs (CSRF protection)
  secure: config.isProduction, // only over https when deployed
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

4. On every request, `route()` verifies the signature with `JWT_SECRET`. A tampered or
   expired token is treated as "not logged in".

**Why a cookie and not localStorage?** Anything in localStorage can be read by any script
on the page, so one XSS bug would leak every session. An httpOnly cookie is invisible to
JavaScript.

**Trade-off:** a JWT cannot be revoked before it expires, and it keeps the name/role it was
issued with. The profile page re-issues the cookie after changes. Logging out deletes the
cookie in that browser only.

## Authorization: what may you do?

`route()` checks, in order:

| Check        | Fails with | Configured by                                |
| ------------ | ---------- | -------------------------------------------- |
| logged in    | 401        | `auth: false` to skip (public routes)        |
| role allowed | 403        | `roles: ['admin']`                           |
| subscription | 402        | `subscription: false` to skip; admins exempt |

The React app has the same rules (`RequireRole`, `SubscriptionGate`), but only for a nicer
experience. **The server is the only place a rule actually protects anything**, because
anyone can call the API directly.

## Multi-tenancy: every shop sees only its own data

Every business record has a `userId`. Handlers never query by id alone:

```js
// ✗ Any logged-in shop could read any product by guessing its id
Product.findById(params.id);

// ✓ Only matches if the product belongs to this shop (admins see all)
Product.findOne(ownedBy(user, { _id: params.id }));
```

When a record belongs to another shop the result is **404 Not found**, not 403, so the API
does not even reveal that the record exists. `tests/inventory.test.js`,
`tests/payments.test.js` and `tests/expenses.test.js` each include a "keeps each shop's
records private" test.

Things that reference other records are checked too: an invoice can only use the shop's own
products and customers, and a purchase only its own products and suppliers.

Money is never trusted from the browser either: invoice and purchase totals are recomputed
on the server from quantity × unit price (minus discount), so a modified request cannot
underprice a sale.

## Input validation

Every request body is parsed with a zod schema before use. This blocks wrong types, missing
fields, absurd lengths, and NoSQL injection (an object like `{ "$gt": "" }` where a string
is expected fails validation).

## Money and stock integrity

- Prices for subscriptions come only from `shared/plans.js` on the server.
- Stock and payment changes use conditional atomic updates, so double submits and races
  cannot oversell stock or over-collect a payment (see [Backend](03-backend.md)).

## HTTP hardening (`app.js`)

| Measure                     | Protects against                                       |
| --------------------------- | ------------------------------------------------------ |
| `helmet()` headers          | clickjacking, MIME sniffing, and more                  |
| Content Security Policy     | scripts from other origins (limits XSS damage)         |
| Rate limit on login/sign-up | password guessing, sign-up spam (20 per 15 min per IP) |
| JSON body limit (1 MB)      | huge request bodies                                    |
| Generic 500 messages        | leaking stack traces or internals                      |

If you deploy behind a proxy (Render, Railway, Nginx), set `TRUST_PROXY=true` so the rate
limiter sees the real client IP.

## Secrets

- All secrets live in `server/.env`, which git ignores.
- `client/.env` only holds `VITE_*` values, which are **public** (they are compiled into
  the JavaScript bundle). Never put a secret there.
- Use a long random `JWT_SECRET` (`openssl rand -base64 32`). Changing it logs everyone out.

## Not covered yet

- Email verification and password reset
- Account lockout after repeated failures (beyond the rate limit)
- An audit log of who changed what
- Staff accounts with limited permissions inside one shop

These are good exercises; see [next steps](11-next-steps.md).
