export const API = {
    FLOWS : {
        KEY     : 'flows',
        URL     : '/api/v0/flows',
        GET     : {
            REQUEST : 'get_flows_request',
            SUCCESS : 'get_flows_success',
            FAILURE : 'get_flows_failure'
        },
        PUT     : {
            REQUEST : 'put_flows_request',
            SUCCESS : 'put_flows_success',
            FAILURE : 'put_flows_failure'
        },
        POST    : {
        },
        DELETE  : {
        }
    },
    COMMANDS : {
        KEY     : 'commands',
        URL     : '/api/v0/commands',
        GET     : {
            REQUEST : 'get_commands_request',
            SUCCESS : 'get_commands_success',
            FAILURE : 'get_commands_failure'
        },
        PUT     : {

        },
        POST    :   {

        },
        DELETE  :   {

        }
    },
    VISUALIZERS : {
        KEY     : 'visualizers',
        URL     : '/api/v0/visualizers',
        GET     : {
            REQUEST : 'get_visualizers_request',
            SUCCESS : 'get_visualizers_success',
            FAILURE : 'get_visualizers_failure'
        },
        PUT     : {

        },
        POST    :   {

        },
        DELETE  :   {
            
        }
    },
    SUBFLOWS : {
        KEY     : 'subflows',
        URL     : '/api/v0/subflows',
        GET     : {
            REQUEST : 'get_subflows_request',
            SUCCESS : 'get_subflows_success',
            FAILURE : 'get_subflows_failure'
        },
        PUT     : {

        },
        POST    :   {

        },
        DELETE  :   {
            
        }
    },
    LIBRARIES : {
        KEY     : 'libraries',
        URL     : '/api/v0/libraries',
        GET     : {
            REQUEST : 'get_libraries_request',
            SUCCESS : 'get_libraries_success',
            FAILURE : 'get_libraries_failure'
        },
        PUT     : {

        },
        POST    :   {

        },
        DELETE  :   {
            
        }
    },
    STORES : {
        KEY     : 'stores',
        URL     : '/api/v0/stores',
        GET     : {
            REQUEST : 'get_stores_request',
            SUCCESS : 'get_stores_success',
            FAILURE : 'get_stores_failure'
        },
        PUT     : {

        },
        POST    :   {

        },
        DELETE  :   {
            
        }
    },
    LOCKS : {
        KEY     : 'locks',
        URL     : '/api/v0/locks',
        GET     : {
        },
        PUT     : {

        },
        POST    :   {
            REQUEST : 'post_locks_request',
            SUCCESS : 'post_locks_success',
            FAILURE : 'post_locks_failure'
        },
        DELETE  :   {
            REQUEST : 'delete_locks_request',
            SUCCESS : 'delete_locks_success',
            FAILURE : 'delete_locks_failure'
        }
    },
}