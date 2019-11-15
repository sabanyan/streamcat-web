import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import {flowEditorReducer, libraryReducer, flowListReducer, apiReducer} from 'Modules/index'
import { reducer as notificationsReducer } from 'reapop'


// default value for notifications
const defaultNotification = {
    position: 'tr',
    dismissible: true,
    dismissAfter: 2000,
    allowHTML: true,
    closeButton: false
}
  
const reducers = combineReducers({
    notifications: notificationsReducer(defaultNotification),
    flowEditorReducer,
    libraryReducer,
    flowListReducer,
    apiReducer
})
const middleWares = applyMiddleware(thunk, window.__REDUX_DEVTOOLS_EXTENSION__)
const store = createStore(reducers, middleWares)

export default store