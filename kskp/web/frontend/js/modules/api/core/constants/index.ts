
const ApiConstants = {
    METHOD  : {
        GET   : 'get',
        PUT   : 'put',
        POST  : 'post',
        DELETE: 'delete'
    },
    FLOWS : {
        KEY     : 'flows',
        URL     : {
            SERVICE : '/api/v0/flows'
        },
        ACTION  : {
            GET     : {
                REQUEST : 'get_flows_request',
                SUCCESS : 'get_flows_success',
                FAILURE : 'get_flows_failure'
            }
        }
    },
    FLOW : {
        KEY     : 'flow',
        URL     : {
            SERVICE : '/api/v0/flows'
        },
        ACTION  : {
            GET     : {
                REQUEST : 'get_flows_request',
                SUCCESS : 'get_flows_success',
                FAILURE : 'get_flows_failure'
            },
            PUT     : {
                REQUEST : 'put_flows_request',
                SUCCESS : 'put_flows_success',
                FAILURE : 'put_flows_failure'
            }
        }
    },
    COMMANDS : {
        KEY     : 'commands',
        URL     : {
            SERVICE:'/api/v0/commands'
        },
        ACTION  : {
            GET     : {
                REQUEST : 'get_commands_request',
                SUCCESS : 'get_commands_success',
                FAILURE : 'get_commands_failure'
            }
        }
    },
    VISUALIZERS : {
        KEY     : 'visualizers',
        URL     : {
            SERVICE:'/api/v0/visualizers'
        },
        ACTION  : {
            GET     : {
                REQUEST : 'get_visualizers_request',
                SUCCESS : 'get_visualizers_success',
                FAILURE : 'get_visualizers_failure'
            }
        }
    },
    SUBFLOWS : {
        KEY     : 'subflows',
        URL     : {
            SERVICE:'/api/v0/subflows'
        },
        ACTION  : {
            GET     : {
                REQUEST : 'get_subflows_request',
                SUCCESS : 'get_subflows_success',
                FAILURE : 'get_subflows_failure'
            }
        }
    },
    LIBRARIES : {
        KEY     : 'libraries',
        URL     : {
            SERVICE : {
                folders : '/api/v0/folders',
                library : '/api/v0/library',
                awss3s  : '/api/v0/awss3s'
            }
        },
        ACTION  : {
            GET     : {
                REQUEST : 'get_libraries_request',
                SUCCESS : 'get_libraries_success',
                FAILURE : 'get_libraries_failure'
            }
        }
    },
    LOCKS : {
        KEY     : 'locks',
        URL     : {
            SERVICE: '/api/v0/locks'
        },
        ACTION  : {
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
        }    
    },
    NAVIGATION : {
        KEY     : 'navigation',
        URL     : {
            SERVICE:'/api/v0/navigation'
        },
        ACTION  : {
            GET     : {
                REQUEST : 'get_navigation_request',
                SUCCESS : 'get_navigation_success',
                FAILURE : 'get_navigation_failure'
            }
        }
    }
}

export default ApiConstants