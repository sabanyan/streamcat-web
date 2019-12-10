import {ApiConstants} from 'Modules/api/core/index'
import { LocksModel } from 'Model/index';


export type State = {
    locks       : LocksModel | null,
}

const initalState:State = {
    locks       : null
}

const apiReducer = (oldState:State = initalState, action:any) => {
    let newState:State = oldState
    try {
        let array   = action.type.split('_')
        let method  = array[0]
        let key     = array[1]
        let status  = array[2]

        switch(action.type) {
            case "NEW_LOCKS"       :
                newState = {...newState, locks : new LocksModel(action.target)}
                break;
            case "UPDATE_LOCKS"    :
                newState = {...newState, locks : action.locks}
                break;
            case "DELETE_LOCKS"    :
                newState = {...newState, locks : null}
                break;

            default:
                break;
        }
    } catch(e) {
        console.log(e)
    } finally {
        return newState
    }
}

export default apiReducer
