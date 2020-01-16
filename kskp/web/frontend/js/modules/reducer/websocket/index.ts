


// giantmachines/redux-websocketにより定義
// https://github.com/giantmachines/redux-websocket

// User dispatched actions
// These actions must be dispatched by you, however we do export action creator functions that can be used.
const REDUX_WEBSOCKET_WEBSOCKET_CONNECT = 'REDUX_WEBSOCKET::WEBSOCKET_CONNECT'
const REDUX_WEBSOCKET_WEBSOCKET_DISCONNECT = 'REDUX_WEBSOCKET::WEBSOCKET_DISCONNECT'
const REDUX_WEBSOCKET_WEBSOCKET_SEND = 'REDUX_WEBSOCKET::WEBSOCKET_SEND'

// Library dispatched actions
// These actions are dispatched automatically by the middlware.
const REDUX_WEBSOCKET_OPEN = 'REDUX_WEBSOCKET::OPEN'
const REDUX_WEBSOCKET_CLOSED = 'REDUX_WEBSOCKET::CLOSED'
const REDUX_WEBSOCKET_MESSAGE = 'REDUX_WEBSOCKET::MESSAGE'
const REDUX_WEBSOCKET_BROKEN = 'REDUX_WEBSOCKET::BROKEN'
const REDUX_WEBSOCKET_BEGIN_RECONNECT = 'REDUX_WEBSOCKET::BEGIN_RECONNECT'
const REDUX_WEBSOCKET_RECONNECT_ATTEMPT = 'REDUX_WEBSOCKET::RECONNECT_ATTEMPT'
const REDUX_WEBSOCKET_RECONNECTED = 'REDUX_WEBSOCKET::RECONNECTED'
const REDUX_WEBSOCKET_ERROR = 'REDUX_WEBSOCKET::ERROR'


type State = {
    
}

export function reducer(state={}, action) {
    let newState = state
    switch (action.type) {
        case REDUX_WEBSOCKET_MESSAGE:
            console.log(action)
            break;

    }

    return newState
}