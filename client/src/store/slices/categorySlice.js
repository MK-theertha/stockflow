import { createCrudSlice } from '../createCrudSlice';

const { reducer, thunks } = createCrudSlice({ name: 'categories', endpoint: '/api/user/category' });

export const {
  fetchAll: fetchCategories,
  add: addCategory,
  update: updateCategory,
  remove: deleteCategory,
} = thunks;

export default reducer;

// The full set, for components such as CrudPage that take all of them.
export { thunks };
