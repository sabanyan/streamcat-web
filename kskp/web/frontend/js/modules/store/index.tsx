import { configureStore } from '@reduxjs/toolkit'
import { reducer as notificationsReducer } from 'reapop'

import { flowEditorReducer, historySlice, networkSlice } from "Modules/features/flowEditor/index";

// default value for notifications
export const defaultNotification = {
    position: 'tr',
    dismissible: true,
    dismissAfter: 2000,
    allowHTML: true,
    closeButton: false
};

export const store = configureStore({
    reducer: {
        flowEditor: flowEditorReducer,
        history: historySlice.reducer,
        network: networkSlice.reducer,
        notification: notificationsReducer
    },
    devTools: process.env.NODE_ENV !== 'production',
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch