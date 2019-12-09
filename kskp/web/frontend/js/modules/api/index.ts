import apiReducer_ from './reducer/index'
import * as REQUEST_GET from './get/index'
import * as REQUEST_PUT from './put/index'
import * as REQUEST_POST from './post/index'
import * as REQUEST_DELETE from './delete/index'

import * as PARSE_GET from './get/parser/index'
import * as PARSE_PUT from './put/parser/index'
import * as PARSE_POST from './post/parser/index'
//import * as PARSE_DELETE from './delete/parser/index'

import * as apiActions_ from './reducer/thunks/index'

export const apiReducer = apiReducer_
export const API = {
    REQUEST : {
        GET     : REQUEST_GET,
        PUT     : REQUEST_PUT,
        POST    : REQUEST_POST,
        DELETE  : REQUEST_DELETE,
    },
    PARSE : {
        GET     : PARSE_GET,
        PUT     : PARSE_PUT,
        POST    : PARSE_POST,
       // DELETE  : PARSE_DELETE
    }
}

export const apiActions = apiActions_