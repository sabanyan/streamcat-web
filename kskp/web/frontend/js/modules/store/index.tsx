import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import {flowEditorReducer, libraryReducer, flowListReducer, apiReducer} from 'Modules/index'
import { reducer as notificationsReducer } from 'reapop'
import { composeWithDevTools } from 'redux-devtools-extension';


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

const enhancers = composeWithDevTools(
    applyMiddleware(thunk),
    // other store enhancers if any
  )

const store = createStore(reducers,  enhancers)

export default store