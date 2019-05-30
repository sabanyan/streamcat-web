//@flow
import Model from '../index'
import { CommandParamType, CommandPortType, SubFlowCommandParamType } from '../../types'

export default class SubflowCommandModel extends Model {
  id: string
  createdAt: string
  creator: string
  description: string
  label: string
  nodes: [] = []
  params: [CommandParamType] = []
  ports: [CommandPortType] = [[],[]]
  projectId: string
  projectName: string
  uuid: string
  classification: string = "subflow"

  constructor (props: SubFlowCommandParamType) {
    super(props)
    this.id = props.uuid //サブフローのIDはUUIDとする
    this.initialize(props,"createdAt")
    this.initialize(props,"creator")
    this.initialize(props,"description")
    this.initialize(props,"label")
    this.initialize(props,"nodes")
    this.initialize(props,"params")
    this.initialize(props,"ports")
    this.initialize(props,"projectId")
    this.initialize(props,"projectName")
    this.initialize(props,"uuid")
  }

  getInPorts():[CommandPortType]{
    return this.ports[0]
  }

  getOutPorts():[CommandPortType]{
    return this.ports[1]
  }

  getParams():[CommandParamType]{
    return this.params
  }

  getLabel() {
    return this.label
  }

  getParam(key:string):CommandParamType{
    let result:CommandParamType = {}
    this.params.find(param =>{
      if(param.name === key)result = param
    })
    return result
  }
}