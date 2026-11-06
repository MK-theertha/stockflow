# StockFlow documentation

StockFlow is a small ERP (Enterprise Resource Planning) system for shops: it tracks what you
buy, what you have in stock, what you sell, and who still owes you money. It is built on the
MERN stack and is meant to be read and learned from.

## Suggested reading order

| #   | Document                                          | What you will learn                                               |
| --- | ------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | [ERP concepts](01-erp-concepts.md)                | The business ideas behind the code: master data, ledgers, etc.    |
| 2   | [Architecture](02-architecture.md)                | How the pieces fit together and what happens on every request     |
| 3   | [Backend](03-backend.md)                          | Express app, routers, the `route()` wrapper, validation, errors   |
| 4   | [Frontend](04-frontend.md)                        | React app, routing, session, Redux vs `useApi`, shared components |
| 5   | [Data model](05-data-model.md)                    | Every MongoDB collection and how they relate                      |
| 6   | [Business flows](06-business-flows.md)            | Purchase → stock → sale → payment, step by step                   |
| 7   | [Security](07-security.md)                        | Login, sessions, multi-tenancy, rate limits, headers              |
| 8   | [API reference](08-api-reference.md)              | Every endpoint with its rules                                     |
| 9   | [Testing](09-testing.md)                          | How the API tests work and how to write one                       |
| 10  | [Tutorial: add a feature](10-adding-a-feature.md) | Build "Expenses" end to end, from model to page                   |
| 11  | [Ideas for next steps](11-next-steps.md)          | Features to build next to keep learning                           |

## Five-minute tour of the repository

```
stockflow/
├── client/          React app (Vite). What the user sees.
├── server/          Express API. Business rules and the database.
├── shared/          Code both sides use (the subscription price table).
├── docs/            You are here.
└── .github/         CI: lint, test and build on every push.
```

Start the app with `npm run dev` (see the main [README](../README.md)), log in, and keep the
code open next to the browser: every page in the sidebar maps to one file in
`client/src/features/`, and every request it makes maps to one handler in `server/src/routes/`.
