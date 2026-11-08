import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { readSessionUser } from './auth.js';
import { Subscription } from '../models/index.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Handlers return json(...) and route() sends it.
export const json = (data, status = 200) => ({ data, status });

const errorResponse = (err) => {
  if (err instanceof HttpError) return json({ err: err.message }, err.status);
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue.path.join('.');
    return json({ err: field ? `${field}: ${issue.message}` : issue.message }, 400);
  }
  if (err instanceof mongoose.Error.CastError) return json({ err: `Invalid ${err.path}` }, 400);
  if (err instanceof mongoose.Error.ValidationError) {
    return json({ err: Object.values(err.errors)[0].message }, 400);
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {}).find((key) => key !== 'userId') ?? 'record';
    return json({ err: `A record with this ${field} already exists` }, 409);
  }
  // express.json() reports a malformed body as a SyntaxError with type 'entity.parse.failed'.
  if (err instanceof SyntaxError || err?.type === 'entity.parse.failed') {
    return json({ err: 'Invalid JSON body' }, 400);
  }

  console.error(err);
  return json({ err: 'Something went wrong' }, 500);
};

const send = (res, { data, status }) => res.status(status).json(data);

/** Express error middleware for errors thrown outside route(), such as a bad JSON body. */
export const errorHandler = (err, req, res, _next) => send(res, errorResponse(err));

export const hasActiveSubscription = (userId) =>
  Subscription.exists({ userId, endDate: { $gt: new Date() } });

/**
 * Wraps a route handler with authentication, authorization and error handling.
 *
 *   router.get('/things', route(async ({ body, params, user }) => json(...)));
 *
 * Options:
 *   auth          - require a logged-in user (default true)
 *   roles         - roles allowed to call the route (default user and admin)
 *   subscription  - require an active subscription; admins are exempt (default true)
 */
export function route(
  handler,
  { auth = true, roles = ['user', 'admin'], subscription = true } = {}
) {
  return async (req, res) => {
    try {
      let user = null;
      if (auth) {
        user = readSessionUser(req);
        if (!user?._id) throw new HttpError(401, 'Please log in');
        if (!roles.includes(user.role)) throw new HttpError(403, 'Forbidden');
        if (subscription && user.role !== 'admin' && !(await hasActiveSubscription(user._id))) {
          throw new HttpError(402, 'Your subscription is not active');
        }
      }

      send(res, await handler({ req, res, body: req.body ?? {}, params: req.params, user }));
    } catch (err) {
      send(res, errorResponse(err));
    }
  };
}

/** Query filter limiting results to the caller's own records. Admins see everything. */
export const ownedBy = (user, filter = {}) =>
  user.role === 'admin' ? filter : { ...filter, userId: user._id };

/**
 * Same as ownedBy() for aggregation pipelines. `$match` does not cast strings to
 * ObjectIds the way find() does, so the user id is converted here.
 */
export const ownedMatch = (user, filter = {}) =>
  user.role === 'admin'
    ? filter
    : { ...filter, userId: new mongoose.Types.ObjectId(String(user._id)) };

/** A case-insensitive "contains" match for user text. Escaped, so it is never run as a pattern. */
export const containsText = (text) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

/** Runs a query for one page. Every paginated list returns { rows, total, page, limit }. */
export async function findPage(Model, filter, { page, limit }, buildQuery = (query) => query) {
  const [rows, total] = await Promise.all([
    buildQuery(Model.find(filter))
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean(),
    Model.countDocuments(filter),
  ]);
  return { rows, total, page, limit };
}

/** Rounds money to 2 decimal places so totals never show floating point noise. */
export const roundMoney = (value) => Math.round(value * 100) / 100;

export const assertObjectId = (id, name = 'id') => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, `Invalid ${name}`);
  return id;
};

/** Throws 404 when `doc` is null, otherwise returns it. */
export const found = (doc, name = 'Record') => {
  if (!doc) throw new HttpError(404, `${name} not found`);
  return doc;
};
