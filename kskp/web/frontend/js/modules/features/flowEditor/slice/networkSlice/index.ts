import { createSlice, PayloadAction } from '@reduxjs/toolkit'


export enum NetworkStatusValue {
  Offline = 'Offline',
  Online = 'Online',
  UnKnown = 'UnKnown'
}

type State = {
  networkStatus: NetworkStatusValue
  lastSavedFlow: {} | null
}

const initialState: State = {
  networkStatus: NetworkStatusValue.UnKnown,
  lastSavedFlow: null
}

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkStatus(state, action: PayloadAction<any>) {
      state.networkStatus = action.payload;
    },
    setLastSavedFlow(state, action: PayloadAction<any>) {
      state.lastSavedFlow = action.payload;
    },
  }
});
