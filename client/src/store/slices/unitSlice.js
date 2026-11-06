import { createCrudSlice } from '../createCrudSlice';

const { reducer, thunks } = createCrudSlice({ name: 'units', endpoint: '/api/user/unit' });

export const {
  fetchAll: fetchUnits,
  add: addUnit,
  update: updateUnit,
  remove: deleteUnit,
} = thunks;

export default reducer;

// The full set, for components such as CrudPage that take all of them.
export { thunks };
