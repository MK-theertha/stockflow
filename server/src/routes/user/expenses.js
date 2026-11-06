import { Router } from 'express';

import { assertObjectId, found, json, ownedBy, route } from '../../lib/api.js';
import { expenseSchema } from '../../lib/validators.js';
import { Expense } from '../../models/index.js';

const router = Router();

router.get(
  '/',
  route(async ({ user }) => json(await Expense.find(ownedBy(user)).sort({ date: -1 })))
);

router.post(
  '/',
  route(async ({ body, user }) => {
    const data = expenseSchema.parse(body);
    return json(await Expense.create({ ...data, userId: user._id }), 201);
  })
);

router.put(
  '/:id',
  route(async ({ body, params, user }) => {
    const data = expenseSchema.parse(body);
    const expense = await Expense.findOneAndUpdate(
      ownedBy(user, { _id: assertObjectId(params.id) }),
      data,
      { new: true, runValidators: true }
    );
    return json(found(expense, 'Expense'));
  })
);

router.delete(
  '/:id',
  route(async ({ params, user }) => {
    const expense = await Expense.findOneAndDelete(
      ownedBy(user, { _id: assertObjectId(params.id) })
    );
    return json(found(expense, 'Expense'));
  })
);

export default router;
