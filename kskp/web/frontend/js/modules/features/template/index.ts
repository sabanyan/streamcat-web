import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type State = {

}

const initialState: State = {
}

export const newSlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    newReduxAction(state, action: PayloadAction<any>) {

    }
  }
});
