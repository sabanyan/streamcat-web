import apiReducer_ from './reducer/index'
import * as GET_ from './thunk/get'
import * as PUT_ from './thunk/put'
import * as POST_ from './thunk/post'
import * as DELETE_ from './thunk/delete'


export const apiReducer = apiReducer_
export const API = {
    GET : GET_,
    PUT : PUT_,
    POST : POST_,
    DELETE : DELETE_
}
