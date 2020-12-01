import {CommandStepModel, DataFrameStepModel, NoteStepModel, SubFlowStepModel} from "Model/index";
import Constants from 'Constants/index';

export interface FlowAllowList {
  copy: boolean
  delete: boolean
  download: boolean
  execute: boolean
  findMember: boolean
  lock: boolean
  move: boolean
  read: boolean
  update: boolean
  updateMember: boolean
}

export enum FlowEditModeValue {
  NotAllowed = 'NotAllowed',
  Editable = 'Editable',
  ReadOnlyUpdateDisabled = 'ReadOnlyUpdateDisabled',
  ReadOnlyLocked = 'ReadOnlyLocked'
}
export enum FlowExecuteModeValue {
  NotExecutable = 'NotExecutable',
  Executable = 'Executable',
}

export type FlowModelProps = {
  allowlist: FlowAllowList
  editMode: FlowEditModeValue
  executeMode: FlowExecuteModeValue
  createdAt?: string
  creator?: string
  folderPath?: string
  folderUuid?: string
  label: string
  nodes: any[]
  params: []
  ports: [[], []]
  projectId?: number
  description: string
  masked?:boolean
  hasInPortWithId: (id: string) => boolean;
  hasOutPortWithId: (id: string) => boolean;
}

export interface DatumAllowList{
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  execute: boolean;
  upload: boolean;
  download: boolean;
  copy: boolean;
  move: boolean;
  lock: boolean;
  findMember: boolean;
  updateMember: boolean;
}

export default class FlowModel {
  createdAt?: string
  creator?: string
  folderPath?: string
  folderUuid?: string
  label: string = ""
  nodes?: any[] = []
  params: [] = []
  ports: [any[], any[]] = [[], []]
  projectId?: number
  description: string = ""
  masked?: boolean

  constructor(props?: FlowModelProps) {
    if (!props) return
    this.createdAt = props.createdAt
    this.creator = props.creator
    this.label = props.label
    this.masked = props.masked
    this.nodes = this.toNodeModels(props.nodes)
    this.params = props.params
    this.ports = props.ports
    this.projectId = props.projectId
    this.description = props.description
    this.folderPath = props.folderPath
    this.folderUuid = props.folderUuid
  }

  toNodeModels(nodes?: any[]) {
    if (!nodes) return []
    
    let results: any[] = []
    nodes.forEach((node, index) => {
      const baseProps:any = {
        id: node.id,
        type: node.type,
        label: node.label,
        position: node.position,
        size: node.size
      }
      if (node.masked) baseProps.masked = node.masked
      let model
      let props
      switch (node.type) {
        case Constants.step.type.frame:
          props = {
            ...baseProps,
            uuid: node.uuid,
            dataSource: Constants.data.dataSource.csv,
            makeCache: node.makeCache,
            cacheCreatedAt: node.cacheCreatedAt
          }
          model = new DataFrameStepModel(props)
          break;
        case Constants.step.type.command:
        case Constants.step.type.subflow:
          props = {
            ...baseProps,
            name: node.name,
            srcs: node.srcs,
            dsts: node.dsts,
            args: node.args
          }
          if (node.type === Constants.step.type.command) {
            props.commandId = node.commandId
            model = new CommandStepModel(props)
          } else if (node.type === Constants.step.type.subflow) {
            props.uuid = node.uuid
            model = new SubFlowStepModel(props)
          }

          break;
        case Constants.step.type.note:
          props = {
            ...baseProps,
            name: node.name,
            title: node.title,
            content: node.content
          }
          model = new NoteStepModel(props)
          break;
        default:
          break;
      }
      if (model) results.push(model)
    })
    return results
  }

  getInPorts() {
    return this.ports[0]
  }

  getOutPorts() {
    return this.ports[1]
  }

  getInPortWithId(id: string) {
    const inPorts = this.getInPorts()
    return inPorts.find((port) => {
      return (port.nodeId === id)
    })
  }

  getOutPortWithId(id: string) {
    const inPorts = this.getOutPorts()
    return inPorts.find((port) => {
      return (port.nodeId === id)
    })
  }

  hasInPortWithId(id: string) {
    return (this.getInPortWithId(id)) ? true : false
  }

  hasOutPortWithId(id: string) {
    return (this.getOutPortWithId(id)) ? true : false
  }

  deletePortWithId(type: number, id: string) {
    let targetPorts = (type === 0) ? this.getInPorts() : this.getOutPorts()
    this.ports[type] = targetPorts.filter((port) => {
      return (port.nodeId !== id)
    })
  }

  deleteInPortWithId(id: string) {
    this.deletePortWithId(0, id)
  }

  deleteOutPortWithId(id: string) {
    this.deletePortWithId(1, id)
  }

  setPort(type: number, port) {
    let targetPorts = (type === 0) ? this.getInPorts() : this.getOutPorts()
    let hasUpdate = false
    this.ports[type] = targetPorts.map((p) => {
      if (p.nodeId === port.nodeId) {
        //ポートを更新
        hasUpdate = true
        return port
      }
      return p
    })
    //ポートを追加
    if (!hasUpdate) this.ports[type].push(port)
  }

  setInPort(port: []) {
    this.setPort(0, port)
  }

  setOutPort(port: []) {
    this.setPort(1, port)
  }
}
