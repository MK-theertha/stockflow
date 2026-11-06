import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { config } from '../config.js';
import { User } from '../models/index.js';

const COOKIE_NAME = 'stockflow_session';
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const secret = () => config.jwtSecret;

// Only these fields are stored in the JWT and exposed as the session user.
export const toSessionUser = (user) => ({
  _id: user._id.toString(),
  name: user.name,
  username: user.username,
  email: user.email,
  image: user.image ?? null,
  role: user.role,
});

/** Returns the session user for valid credentials, otherwise null. */
export async function authenticate(email, password) {
  const user = await User.findOne({ email }).select('+password');
  if (!user?.password || !(await bcrypt.compare(password, user.password))) return null;
  return toSessionUser(user);
}

export function setSessionCookie(res, user) {
  const token = jwt.sign({ user }, secret(), { expiresIn: MAX_AGE_SECONDS });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: MAX_AGE_SECONDS * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
}

/** The user stored in the session cookie, or null when missing, expired or tampered with. */
export function readSessionUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, secret()).user ?? null;
  } catch {
    return null;
  }
}
