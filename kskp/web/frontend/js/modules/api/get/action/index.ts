import {ApiConstants as API} from 'Modules/api/core/index'

// Flows
export function FlowsRequest(projectUUID:string, withoutNav?:boolean) {
    return {
        type        : API.FLOWS.ACTION.GET.REQUEST,
        projectUUID : projectUUID,
        withoutNav  : withoutNav   
    }
}

export function FlowRequest(flowUUID:string, withoutNav?:boolean, withLock?:boolean) {
    return {
        type        : API.FLOWS.ACTION.GET.REQUEST,
        flowUUID    : flowUUID,
        withoutNav  : withoutNav,
        withLock : withLock
    }
}

export function FlowsSuccess(res){return {type : API.FLOWS.ACTION.GET.SUCCESS, res : res}}
export function FlowsFailure(err){return {type : API.FLOWS.ACTION.GET.FAILURE, err : err}}

// Commands
export function CommandsRequest() {return {type : API.COMMANDS.ACTION.GET.REQUEST}} 
export function CommandsSuccess(res){return {type : API.COMMANDS.ACTION.GET.SUCCESS, res : res}}
export function CommandsFailure(err){return {type : API.COMMANDS.ACTION.GET.FAILURE, err : err}}

// Visualizers
export function VisualizersRequest(){return {type : API.VISUALIZERS.ACTION.GET.REQUEST}} 
export function VisualizersSuccess(res){return {type : API.VISUALIZERS.ACTION.GET.SUCCESS, res : res}}
export function VisualizersFailure(err){return {type : API.VISUALIZERS.ACTION.GET.FAILURE, err : err}}

// Subflows
export function SubflowsRequest(){return {type : API.SUBFLOWS.ACTION.GET.REQUEST}} 
export function SubflowsSuccess(res){return {type : API.SUBFLOWS.ACTION.GET.SUCCESS, res : res}}
export function SubflowsFailure(err){return {type : API.SUBFLOWS.ACTION.GET.FAILURE, err : err}}

// Libraries
export function LibrariesRequest(folder_uuid?:string){return {type : API.LIBRARIES.ACTION.GET.REQUEST}}
export function LibrariesSuccess(res){return {type : API.LIBRARIES.ACTION.GET.SUCCESS, res : res}}
export function LibrariesFailure(err){return {type : API.LIBRARIES.ACTION.GET.FAILURE, err : err}}

// Navigation
export function NavigationRequest(){return {type : API.NAVIGATION.ACTION.GET.REQUEST}}
export function NavigationSuccess(res){return {type : API.NAVIGATION.ACTION.GET.SUCCESS, res : res}}
export function NavigationFailure(err){return {type : API.NAVIGATION.ACTION.GET.FAILURE, err : err}}
