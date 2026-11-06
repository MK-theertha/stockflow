import { createCrudSlice } from '../createCrudSlice';

const { reducer, thunks } = createCrudSlice({ name: 'suppliers', endpoint: '/api/user/supplier' });

export const {
  fetchAll: fetchSuppliers,
  add: addSupplier,
  update: updateSupplier,
  remove: deleteSupplier,
} = thunks;

export default reducer;

// The full set, for components such as CrudPage that take all of them.
export { thunks };
