import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { HttpError, found, json, route } from '../../lib/api.js';
import { setSessionCookie, toSessionUser } from '../../lib/auth.js';
import { changePasswordSchema, profileSchema } from '../../lib/validators.js';
import { User } from '../../models/index.js';

const router = Router();

// The logged-in user's own account. Works without a subscription.
const accountRoute = (handler) => route(handler, { subscription: false });

router.get(
  '/profile',
  accountRoute(async ({ user }) => json(found(await User.findById(user._id), 'User')))
);

router.put(
  '/profile',
  accountRoute(async ({ body, res, user }) => {
    const { name, phone, image } = profileSchema.parse(body);
    const updated = found(
      await User.findByIdAndUpdate(
        user._id,
        { name, phone, image: image || undefined },
        { new: true, runValidators: true }
      ),
      'User'
    );

    // The session cookie holds a copy of the name and image, so refresh it.
    setSessionCookie(res, toSessionUser(updated));
    return json(updated);
  })
);

router.post(
  '/change-password',
  accountRoute(async ({ body, user }) => {
    const { oldPassword, newPassword } = changePasswordSchema.parse(body);
    const account = found(await User.findById(user._id).select('+password'), 'User');

    if (!(await bcrypt.compare(oldPassword, account.password))) {
      throw new HttpError(400, 'Current password is incorrect');
    }
    account.password = await bcrypt.hash(newPassword, 10);
    await account.save();
    return json({ message: 'Password changed' });
  })
);

export default router;
