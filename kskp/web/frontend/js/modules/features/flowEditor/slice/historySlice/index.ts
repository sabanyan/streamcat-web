import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'

type State = {
  current: number,
  history: any[],
  currentHistory: any
}

const initialState: State = {
  current: 0,
  history: [],
  currentHistory: null
}

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    init(state, action: PayloadAction<any>) {
      state.current = 0;
      state.history = [action.payload]
      state.currentHistory = state.history[state.current]
    },
    add(state, action: PayloadAction<any>) {
      // currentと異なる場合のみ、追加
      if (isDifferentHistory(state.history[state.current], action.payload)) {
        state.history.push(action.payload);
        state.current = state.current + 1;

        //前に戻っている状態で履歴が追加された場合は、current以降の履歴は消すため
        if (state.current < state.history.length - 1) {
          state.history = state.history.slice(0, state.current + 1);
        }

        //履歴が多すぎる場合は、古い履歴は消すため
        if (state.current > 25) {
          state.history = state.history.slice(1, state.current + 1);
        }

        state.currentHistory = state.history[state.current]
      }
    },
    prev(state, action) {
      state.current = state.current - 1;
      state.currentHistory = state.history[state.current]
    },
    next(state, action) {
      state.current = state.current + 1;
      state.currentHistory = state.history[state.current]
    }
  }
});

function isDifferentHistory(one: any, another: any) {
  return !(_.isEqual(one, another));
}