import { createCrudSlice } from '../createCrudSlice';

const { reducer, thunks } = createCrudSlice({ name: 'products', endpoint: '/api/user/products' });

export const {
  fetchAll: fetchProducts,
  add: addProduct,
  update: updateProduct,
  remove: deleteProduct,
} = thunks;

export default reducer;

// The full set, for components such as CrudPage that take all of them.
export { thunks };
