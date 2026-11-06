import { configureStore } from '@reduxjs/toolkit';

import categoryReducer from './slices/categorySlice';
import customerReducer from './slices/customerSlice';
import expenseReducer from './slices/expenseSlice';
import productReducer from './slices/productSlice';
import supplierReducer from './slices/supplierSlice';
import unitReducer from './slices/unitSlice';

export const store = configureStore({
  reducer: {
    categories: categoryReducer,
    units: unitReducer,
    products: productReducer,
    suppliers: supplierReducer,
    customers: customerReducer,
    expenses: expenseReducer,
  },
});
