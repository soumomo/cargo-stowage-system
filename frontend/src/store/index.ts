import { configureStore } from '@reduxjs/toolkit';
import containersReducer from './containersSlice';
import itemsReducer from './itemsSlice';
import stowagePlansReducer from './stowagePlansSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    containers: containersReducer,
    items: itemsReducer,
    stowagePlans: stowagePlansReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 