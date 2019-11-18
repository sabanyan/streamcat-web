import apiReducer_ from './reducer/index'
import * as GET_ from './get/index'
import * as PUT_ from './put/index'
import * as POST_ from './post/index'
import * as DELETE_ from './delete/index'

export const apiReducer = apiReducer_
export const API = {
    GET : GET_,
    PUT : PUT_,
    POST : POST_,
    DELETE : DELETE_
}

export {State, DataState} from './reducer/index'