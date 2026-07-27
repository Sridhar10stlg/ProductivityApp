import { configureStore } from '@reduxjs/toolkit';
import { transactionApi } from '../modules/expenses/store/expenseApi';
import { todoApi } from '../modules/todos/store/todoApi';
import { todoUiReducer } from '../modules/todos/store/todoUiSlice';
import { worklogApi } from '../modules/worklog/store/worklogApi';

export const store = configureStore({
  reducer: {
    [transactionApi.reducerPath]: transactionApi.reducer,
    [todoApi.reducerPath]: todoApi.reducer,
    [worklogApi.reducerPath]: worklogApi.reducer,
    todoUi: todoUiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(transactionApi.middleware)
      .concat(todoApi.middleware)
      .concat(worklogApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
