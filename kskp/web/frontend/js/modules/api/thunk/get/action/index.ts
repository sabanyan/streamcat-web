import {API} from 'Modules/api/core/index'

// Flows
export function FlowsRequest(projectUUID:string, withoutNav?:boolean) {
    return {
        type        : API.FLOWS.GET.REQUEST,
        projectUUID : projectUUID,
        withoutNav  : withoutNav   
    }
}

export function FlowRequest(flowUUID:string, withoutNav?:boolean, withLock?:boolean) {
    return {
        type        : API.FLOWS.GET.REQUEST,
        flowUUID    : flowUUID,
        withoutNav  : withoutNav,
        withLock : withLock
    }
}

export function FlowsSuccess(res){return {type : API.FLOWS.GET.SUCCESS, res : res}}
export function FlowsFailure(err){return {type : API.FLOWS.GET.FAILURE, err : err}}

// Commands
export function CommandsRequest() {return {type : API.COMMANDS.GET.REQUEST}} 
export function CommandsSuccess(res){return {type : API.COMMANDS.GET.SUCCESS, res : res}}
export function CommandsFailure(err){return {type : API.COMMANDS.GET.FAILURE, err : err}}

// Visualizers
export function VisualizersRequest(){return {type : API.VISUALIZERS.GET.REQUEST}} 
export function VisualizersSuccess(res){return {type : API.VISUALIZERS.GET.SUCCESS, res : res}}
export function VisualizersFailure(err){return {type : API.VISUALIZERS.GET.FAILURE, err : err}}

// Subflows
export function SubflowsRequest(){return {type : API.SUBFLOWS.GET.REQUEST}} 
export function SubflowsSuccess(res){return {type : API.SUBFLOWS.GET.SUCCESS, res : res}}
export function SubflowsFailure(err){return {type : API.SUBFLOWS.GET.FAILURE, err : err}}

// Libraries
export function LibrariesRequest(folder_uuid?:string){return {type : API.LIBRARIES.GET.REQUEST}}
export function LibrariesSuccess(res){return {type : API.LIBRARIES.GET.SUCCESS, res : res}}
export function LibrariesFailure(err){return {type : API.LIBRARIES.GET.FAILURE, err : err}}

// Stores
export function StoresRequest(){return {type : API.STORES.GET.REQUEST}}
export function StoresSuccess(res){return {type : API.STORES.GET.SUCCESS, res : res}}
export function StoresFailure(err){return {type : API.STORES.GET.FAILURE, err : err}}
