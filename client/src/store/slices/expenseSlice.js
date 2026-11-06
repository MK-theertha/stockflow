import { createCrudSlice } from '../createCrudSlice';

const { reducer, thunks } = createCrudSlice({ name: 'expenses', endpoint: '/api/user/expenses' });

export const {
  fetchAll: fetchExpenses,
  add: addExpense,
  update: updateExpense,
  remove: deleteExpense,
} = thunks;

export default reducer;

// The full set, for components such as CrudPage that take all of them.
export { thunks };
