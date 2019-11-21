import {ApiConstants} from 'Modules/api/core/index'
import Modelizer from 'Modules/api/core/modelizer/index';

export type State = {
    flows       : DataState,
    flow        : DataState,
    commands    : DataState,
    visualizers : DataState,
    subflows    : DataState,
    navigation  : DataState,
    libraries   : DataState,
    stores      : DataState,
    locks       : DataState,
}

export type DataState = {
    isFetching  : boolean,
    lastData    : any | null
}

const initialDataState:DataState = {
    isFetching  : false,
    lastData    : null
}

const initalState:State = {
    flows       : initialDataState,
    flow        : initialDataState,
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
        switch(action.type) {
            // GET
                // Flows
                case ApiConstants.FLOWS.ACTION.GET.SUCCESS       :
                    newState = handleSuccess(newState, ApiConstants.FLOWS.KEY, action.res)
                    break;
                // Commands
                case ApiConstants.COMMANDS.ACTION.GET.SUCCESS    :
                    newState = handleSuccess(newState, ApiConstants.COMMANDS.KEY, action.res)
                    break;
                // Visualizers
                case ApiConstants.VISUALIZERS.ACTION.GET.SUCCESS    :
                    newState = handleSuccess(newState, ApiConstants.VISUALIZERS.KEY, action.res)
                    break;
                // Subflows
                case ApiConstants.SUBFLOWS.ACTION.GET.SUCCESS    :
                    newState = handleSuccess(newState, ApiConstants.SUBFLOWS.KEY, action.res)
                    break;
                // Libraries
                case ApiConstants.LIBRARIES.ACTION.GET.SUCCESS    :
                    newState = handleSuccess(newState, ApiConstants.LIBRARIES.KEY, action.res)
                    break;
                // Navgation
                case ApiConstants.NAVIGATION.ACTION.GET.SUCCESS     :
                    newState = handleSuccess(newState, ApiConstants.NAVIGATION.KEY, action.res)
                    break;
            // PUT
                // FLOW
                case ApiConstants.FLOW.ACTION.PUT.SUCCESS    :
                    newState = handleSuccess(newState, ApiConstants.FLOWS.KEY, action.res)
                    break;
            // POST
                // LOCKS
                case ApiConstants.LOCKS.ACTION.POST.REQUEST    :
                    data = (newState[key].lastData) ? newState[key].lastData : Modelizer({target:action.target}, key)
                    newDataState = {...newState[key], lastData: data, isFetching:true}
                    newState = {...newState, [key]:newDataState}
                    break;
                case ApiConstants.LOCKS.ACTION.POST.SUCCESS    :
                    data = newState[key].lastData.Parse(action.res)
                    newDataState = {...newState[key], lastData: data, shouldUpdate:true, response:action.res}
                    newState = {...oldState, [key]:newDataState}
                    break;
            // DELETE
                // LOCKS
                case ApiConstants.LOCKS.ACTION.DELETE.SUCCESS    :
                    newDataState = {...newState[key], lastData:null, isFetching:false}
                    newState = {...newState, [key]:newDataState}
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

function handleSuccess(oldState:State, key:string, res) {
    let newDataState = {...oldState[key], lastData: Modelizer(res.data.data, key)}
    let newState = {...oldState, [key]:newDataState}

    return newState
}