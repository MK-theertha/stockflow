import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { generateFromEmail } from 'unique-username-generator';

import { HttpError, json, route } from '../lib/api.js';
import {
  authenticate,
  clearSessionCookie,
  readSessionUser,
  setSessionCookie,
} from '../lib/auth.js';
import { registerSchema } from '../lib/validators.js';
import { User } from '../models/index.js';

const router = Router();

router.post(
  '/auth/login',
  route(
    async ({ body, res }) => {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;
      if (!email || !password) throw new HttpError(400, 'Email and password are required');

      // Same message for unknown email and wrong password, so attackers
      // cannot use the login form to find out which emails are registered.
      const user = await authenticate(email, password);
      if (!user) throw new HttpError(401, 'Invalid email or password');

      setSessionCookie(res, user);
      return json({ user });
    },
    { auth: false }
  )
);

router.post(
  '/auth/logout',
  route(
    async ({ res }) => {
      clearSessionCookie(res);
      return json({ success: true });
    },
    { auth: false }
  )
);

router.get(
  '/auth/session',
  route(async ({ req }) => json({ user: readSessionUser(req) }), { auth: false })
);

router.post(
  '/register',
  route(
    async ({ body }) => {
      const { name, email, phone, password } = registerSchema.parse(body);

      await User.create({
        // The username must fit the 20 character limit even for long emails.
        username: generateFromEmail(email, 4).slice(0, 20),
        name,
        email,
        phone,
        password: await bcrypt.hash(password, 10),
      });

      return json({ msg: 'Registered successfully' }, 201);
    },
    { auth: false }
  )
);

export default router;
