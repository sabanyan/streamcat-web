


// giantmachines/redux-websocketにより定義
// https://github.com/giantmachines/redux-websocket

// User dispatched actions
// These actions must be dispatched by you, however we do export action creator functions that can be used.
const REDUX_WEBSOCKET_WEBSOCKET_CONNECT = 'REDUX_WEBSOCKET::WEBSOCKET_CONNECT'
const REDUX_WEBSOCKET_WEBSOCKET_DISCONNECT = 'REDUX_WEBSOCKET::WEBSOCKET_DISCONNECT'
const REDUX_WEBSOCKET_WEBSOCKET_SEND = 'REDUX_WEBSOCKET::SEND'

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

// Custom Action
const WEBSOCKET_CLEAR_RESULT = 'KSKP_CLEAR_RESULT'

export const websocketClearResultAction = () => {
    return {
        type: WEBSOCKET_CLEAR_RESULT
    }
}

type State = {
    logs: string[]
    excuteResult: string[],
    excuteException: string[],
}

const initialState: State = {
    logs: [],
    excuteResult: [],
    excuteException: [],
}

export function reducer(state = initialState, action) {
    let newState: State = state
    try {
        switch (action.type) {
            case REDUX_WEBSOCKET_MESSAGE:
                newState = messageHandler(state, action)
                break;

            case REDUX_WEBSOCKET_WEBSOCKET_SEND:
                newState = parseFlowExcuteStart(state, action)
                break;

            case WEBSOCKET_CLEAR_RESULT:
                newState = clearResult(state, action)
        }
    } catch (e) {
        console.log(e)
    } finally {
        return newState
    }
}

// backendのsocket.pyで定義したメッセージと一致させること
const MESSAGE_FLOW_EXCUTE_START = "MESSAGE_FLOW_EXCUTE_START"
const MESSAGE_FLOW_EXCUTE_LOG = "MESSAGE_FLOW_EXCUTE_LOG"
const MESSAGE_FLOW_EXCUTE_END = "MESSAGE_FLOW_EXCUTE_END"
const MESSAGE_EXCEPTION = "MESSAGE_EXCEPTION"

function messageHandler(state, action) {
    let newState = state

    // kskpで定義したメッセージ
    let customMessage = JSON.parse(action.payload.message)
    switch (customMessage.type) {
        case MESSAGE_FLOW_EXCUTE_START:
            newState = parseFlowExcuteStart(state, customMessage)
            break
        case MESSAGE_FLOW_EXCUTE_LOG:
            newState = parseFlowExcuteLog(state, customMessage)
            break
        case MESSAGE_FLOW_EXCUTE_END:
            newState = parseFlowExcuteEnd(state, customMessage)
            break
        case MESSAGE_EXCEPTION:
            newState = parseException(state, customMessage)
            break
    }

    return newState
}

function parseFlowExcuteStart(state: State, action: any): State {
    let newLogs = state.logs.slice(0, state.logs.length)
    let startLog = "[START] flow is running... \n"
    newLogs.push(startLog)
    let newState = { ...state, logs: newLogs }

    return newState
}

function parseFlowExcuteLog(state: State, customMessage: any): State {
    let newLogs = state.logs.slice(0, state.logs.length)
    newLogs.push(customMessage.data)
    let newState = { ...state, logs: newLogs }

    return newState
}

function parseFlowExcuteEnd(state: State, customMessage: any): State {
    let newLogs = state.logs.slice(0, state.logs.length)
    let endLog = "[END]\n"
    newLogs.push(endLog)
    let result = []

    if (Array.isArray(customMessage.data)) {
        customMessage.data.forEach((result, index) => {
            let label = result.label
            let uuid = result.uuid
            let resultLog = "[RESULT] : " + label + " (" + uuid + ") \n"
            newLogs.push(resultLog)
            result.push(resultLog)
        });
    }
    let newState = { ...state, logs: newLogs, excuteResult: result }

    return newState
}

function parseException(state: State, customMessage: any): State {
    let newLogs = state.logs.slice(0, state.logs.length)
    let exceptionLog = "[EXCEPTION] " + customMessage.data + " \n"
    newLogs.push(exceptionLog)
    let newState = { ...state, logs: newLogs, excuteException: [customMessage.data] }
    return newState
}

function clearResult(state: State, action): State {
    return {...state, excuteResult: [], excuteException: []}
}