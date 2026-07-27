import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SmartView } from '../types/todo.types';

interface TodoUiState {
  selectedView: SmartView | null;
  selectedListId: number | null;
  selectedTaskId: number | null;
}

const initialState: TodoUiState = {
  selectedView: 'myday',
  selectedListId: null,
  selectedTaskId: null,
};

const todoUiSlice = createSlice({
  name: 'todoUi',
  initialState,
  reducers: {
    selectSmartView(state, action: PayloadAction<SmartView>) {
      state.selectedView = action.payload;
      state.selectedListId = null;
      state.selectedTaskId = null;
    },
    selectList(state, action: PayloadAction<number>) {
      state.selectedView = null;
      state.selectedListId = action.payload;
      state.selectedTaskId = null;
    },
    selectTask(state, action: PayloadAction<number | null>) {
      state.selectedTaskId = action.payload;
    },
  },
});

export const { selectSmartView, selectList, selectTask } = todoUiSlice.actions;
export const todoUiReducer = todoUiSlice.reducer;
