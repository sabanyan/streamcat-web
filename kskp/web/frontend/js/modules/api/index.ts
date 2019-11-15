import apiReducer_ from './reducer/index'
export {default as GET} from './get/index'

import * as PUT_ from './thunk/put'
import * as POST_ from './thunk/post'
import * as DELETE_ from './thunk/delete'


export const apiReducer = apiReducer_
export const API = {
    GET : new GET(),
    PUT : PUT_,
    POST : POST_,
    DELETE : DELETE_
}
