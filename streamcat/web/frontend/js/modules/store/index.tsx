import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'
import { reducer as notificationsReducer, setUpNotifications } from 'reapop'
import { composeWithDevTools } from '@redux-devtools/extension';
import { CommonReducer } from 'Modules/reducers/index'
import { FlowEditorReducer } from 'Modules/index'


// reapopの初期値を設定する
setUpNotifications({
    defaultProps: {
        position: 'top-right',
        // 通知ダイアログのクリックで閉じる
        dismissible: true,
        // 通知ダイアログが消えるまでの時間 (0:消えない)
        dismissAfter: 0,
        // 通知ダイアログにHTMLの記述を許可しない
        // TODO: HTMLを用いたメッセージがあるので暫定的に許可する
        allowHTML: true,
        // 閉じるボタンを表示しない
        closeButton: false
    }
});

const rootReducer = combineReducers({
    notifications: notificationsReducer(),
    FlowEditorReducer,
    CommonReducer
});

const enhancers = composeWithDevTools(
    applyMiddleware(thunk),
    // other store enhancers if any
)

const store = createStore(rootReducer, enhancers)

export default store
