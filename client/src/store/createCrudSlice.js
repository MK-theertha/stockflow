import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { apiFetch } from '@/lib/api-client';

// Rejects with the error message string, so `.unwrap().catch((message) => ...)` works.
const thunk = (type, request) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await request(arg);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  });

/**
 * Builds a slice with fetch / add / update / remove thunks for a REST resource.
 * State shape: { [name]: [], loading: boolean, error: string | null }.
 */
export function createCrudSlice({ name, endpoint }) {
  const thunks = {
    fetchAll: thunk(`${name}/fetchAll`, () => apiFetch(endpoint)),
    add: thunk(`${name}/add`, (item) => apiFetch(endpoint, { method: 'POST', body: item })),
    update: thunk(`${name}/update`, (item) =>
      apiFetch(`${endpoint}/${item._id}`, { method: 'PUT', body: item })
    ),
    remove: thunk(`${name}/remove`, async (id) => {
      await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
      return id;
    }),
  };

  const slice = createSlice({
    name,
    initialState: { [name]: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(thunks.fetchAll.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(thunks.fetchAll.fulfilled, (state, action) => {
          state.loading = false;
          state[name] = action.payload;
        })
        .addCase(thunks.add.fulfilled, (state, action) => {
          const created = Array.isArray(action.payload) ? action.payload : [action.payload];
          state[name].push(...created);
        })
        .addCase(thunks.update.fulfilled, (state, action) => {
          const index = state[name].findIndex((item) => item._id === action.payload._id);
          if (index !== -1) state[name][index] = action.payload;
        })
        .addCase(thunks.remove.fulfilled, (state, action) => {
          state[name] = state[name].filter((item) => item._id !== action.payload);
        })
        .addMatcher(
          (action) => action.type.startsWith(`${name}/`) && action.type.endsWith('/rejected'),
          (state, action) => {
            state.loading = false;
            state.error = action.payload ?? action.error.message;
          }
        );
    },
  });

  return { reducer: slice.reducer, thunks };
}
