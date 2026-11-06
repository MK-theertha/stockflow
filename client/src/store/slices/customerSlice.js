import { createCrudSlice } from '../createCrudSlice';

const { reducer, thunks } = createCrudSlice({ name: 'customers', endpoint: '/api/user/customers' });

export const {
  fetchAll: fetchCustomers,
  add: addCustomer,
  update: updateCustomer,
  remove: deleteCustomer,
} = thunks;

export default reducer;

// The full set, for components such as CrudPage that take all of them.
export { thunks };
