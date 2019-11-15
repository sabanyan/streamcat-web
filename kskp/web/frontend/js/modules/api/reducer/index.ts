import {API} from 'Modules/api/core/index'
import {Modelizer} from 'Modules/api/modelizer/index';

type State = {
    flows       : DataState,
    commands    : DataState,
    visualizers : DataState,
    subflows    : DataState,
    navigation  : DataState,
    libraries   : DataState,
    stores      : DataState,
    locks       : DataState,
}

type DataState = {
    isFetching  : boolean,
    lastData    : any | null
}

const initialDataState:DataState = {
    isFetching  : false,
    lastData    : null
}

const initalState:State = {
    flows       : initialDataState,
    commands    : initialDataState,
    visualizers : initialDataState,
    subflows    : initialDataState,
    navigation  : initialDataState,
    libraries   : initialDataState,
    stores      : initialDataState,
    locks       : initialDataState
}

const apiReducer = (oldState:State = initalState, action:any) => {
    let newState:State = oldState
    try {
        let array   = action.type.split('_')
        let method  = array[0]
        let key     = array[1]
        let status  = array[2]
        
        let newDataState
        let data

        switch(method) {
            // GET
                // Flows
                case API.FLOWS.GET.REQUEST       :
                    newState = handleRequest(newState, API.FLOWS.KEY)
                    break;
                case API.FLOWS.GET.SUCCESS       :
                    newState = handleSuccess(newState, API.FLOWS.KEY, action.res)
                    break;
                case API.FLOWS.GET.FAILURE       :
                    newState = handleFailure(newState, API.FLOWS.KEY)
                    throw action.err
                // Commands
                case API.COMMANDS.GET.REQUEST    :
                    newState = handleRequest(newState, API.COMMANDS.KEY)
                    break;
                case API.COMMANDS.GET.SUCCESS    :
                    newState = handleSuccess(newState, API.COMMANDS.KEY, action.res)
                    break;
                case API.COMMANDS.GET.FAILURE :
                    newState = handleFailure(newState, API.COMMANDS.KEY)
                    throw action.err
                // Visualizers
                case API.VISUALIZERS.GET.REQUEST    :
                    newState = handleRequest(newState, API.VISUALIZERS.KEY)
                    break;
                case API.VISUALIZERS.GET.SUCCESS    :
                    newState = handleSuccess(newState, API.VISUALIZERS.KEY, action.res, true)
                    break;
                case API.VISUALIZERS.GET.FAILURE :
                    newState = handleFailure(newState, API.VISUALIZERS.KEY)
                    throw action.err
                // Subflows
                case API.SUBFLOWS.GET.REQUEST    :
                    newState = handleRequest(newState, API.SUBFLOWS.KEY)
                    break;
                case API.SUBFLOWS.GET.SUCCESS    :
                    newState = handleSuccess(newState, API.SUBFLOWS.KEY, action.res)
                    break;
                case API.SUBFLOWS.GET.FAILURE :
                    newState = handleFailure(newState, API.SUBFLOWS.KEY)
                    throw action.err
                // Libraries
                case API.LIBRARIES.GET.REQUEST    :
                    newState = handleRequest(newState, API.LIBRARIES.KEY)
                    break;
                case API.LIBRARIES.GET.SUCCESS    :
                    newState = handleSuccess(newState, API.LIBRARIES.KEY, action.res)
                    break;
                case API.LIBRARIES.GET.FAILURE :
                    newState = handleFailure(newState, API.LIBRARIES.KEY)
                    throw action.err
                // Stores
                case API.STORES.GET.REQUEST    :
                    newState = handleRequest(newState, API.STORES.KEY)
                    break;
                case API.STORES.GET.SUCCESS    :
                    newState = handleSuccess(newState, API.STORES.KEY, action.res)
                    break;
                case API.STORES.GET.FAILURE :
                    newState = handleFailure(newState, API.STORES.KEY)
                    throw action.err
            // PUT
                // FLOWS
                case API.FLOWS.PUT.REQUEST    :
                    newState = handleRequest(newState, API.STORES.KEY)
                    break;
                case API.FLOWS.PUT.SUCCESS    :
                    newState = handleSuccess(newState, API.FLOWS.KEY, action.res)
                    break;
                case API.FLOWS.PUT.FAILURE :
                    newState = handleFailure(newState, API.FLOWS.KEY)
                    throw action.err
            // POST
                // LOCKS
                case API.LOCKS.POST.REQUEST    :
                    data = (newState[key].lastData) ? newState[key].lastData : Modelizer({target:action.target}, key)
                    newDataState = {...newState[key], lastData: data, isFetching:true}
                    newState = {...newState, [key]:newDataState}
                    break;
                case API.LOCKS.POST.SUCCESS    :
                    data = newState[key].lastData.Parse(action.res)
                    newDataState = {...newState[key], lastData: data, shouldUpdate:true, response:action.res}
                    newState = {...oldState, [key]:newDataState}
                    break;
                case API.LOCKS.POST.FAILURE :
                    newDataState = {...oldState[key], isFetching:false}  
                    newState = {...newState, [key]:newDataState}
                    throw action.err
            // DELETE
                // LOCKS
                case API.LOCKS.DELETE.REQUEST    :
                    newDataState = {...newState[key], isFetching:true}
                    newState = {...newState, [key]:newDataState}
                    break;
                case API.LOCKS.DELETE.SUCCESS    :
                    newDataState = {...newState[key], lastData:null, isFetching:false}
                    newState = {...newState, [key]:newDataState}
                    break;
                case API.LOCKS.DELETE.FAILURE :
                    newDataState = {...newState[key], isFetching:false}
                    newState = {...newState, [key]:newDataState}
                    throw action.err

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

function handleRequest(oldState:State, key:string) {
    let oldDataState = {...oldState[key], isFetching:true}  

    return {...oldState, [key]:oldDataState}
}

function handleSuccess(oldState:State, key:string, res, toModel:boolean = false) {
    let newState = {
        ...oldState, 
        [key] : parseData(oldState[key], key, res, toModel), 
        ["navigation"] : handleNavi(oldState["navigation"], res)
    }

    return newState
}

    function parseData(oldDataState:DataState, key:string, res, toModel:boolean = false):DataState {
        let newDataState = {...oldDataState, isFetching:false}
        if (!res.data) throw "Failed with Pasrsing " + key + " (res.data is not defined)" 
        if (res.data.success !== true) throw res.data.message
        if (!res.data.data) throw res.data.data
        let lastData = (toModel) ? Modelizer(res.data.data, key) : res.data.data
        newDataState = {...newDataState, shouldUpdate:true, lastData:lastData, response:res}

        return newDataState
    }

    function handleNavi(oldNaviState:DataState, res):DataState {
        let newNaviState = oldNaviState
        if (!res.data || !res.data.navigation) return newNaviState
        newNaviState = {...newNaviState, isFetching:false, shouldUpdate:true, lastData:res.data.n, response:res}

        return newNaviState
    }

function handleFailure(oldState:State, key:string) {  
    let oldDataState = {...oldState[key], isFetching:false}  

    return {...oldState, [key]:oldDataState}
}