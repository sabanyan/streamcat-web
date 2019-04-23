//@flow
import Model from '../index'

export type FlowModelProps = {
  createdAt : ?string,
  creator: ?string,
  label: string,
  nodes: [],
  params: [],
  ports: [[],[]],
  projectId: ?number,
  description: string,
}

export default class FlowModel<FlowModelProps> extends Model {
  createdAt = null
  creator = null
  label:string = ""
  params:[] = []
  ports:[[],[]] = [[],[]]
  nodes:[] = []
  projectId = null
  description = ""

  constructor (props: FlowModelProps) {
    super()
    this.initialize(props,"createdAt")
    this.initialize(props,"creator")
    this.initialize(props,"label")
    this.initialize(props,"params")
    this.initialize(props,"ports")
    this.initialize(props,"nodes")
    this.initialize(props,"projectId")
    this.initialize(props,"description")
  }

  getInPorts(){
    return this.ports[0]
  }

  getOutPorts(){
    return this.ports[1]
  }

  getInPortWithId(id:string){
    const inPorts = this.getInPorts()
    return inPorts.find((port)=>{
      return (port.nodeId === id)
    })
  }

  getOutPortWithId(id:string){
    const inPorts = this.getOutPorts()
    return inPorts.find((port)=>{
      return (port.nodeId === id)
    })
  }

  hasInPortWithId(id:string){
    return (this.getInPortWithId(id))?true:false
  }

  hasOutPortWithId(id:string){
    return (this.getOutPortWithId(id))?true:false
  }
  deletePortWithId(type:number,id:string){
    let targetPorts = (type === 0)?this.getInPorts():this.getOutPorts()
    this.ports[type] = targetPorts.filter((port)=>{
      return (port.nodeId !== id)
    })
  }

  deleteInPortWithId(id:string){
    this.deletePortWithId(0,id)
  }

  deleteOutPortWithId(id:string){
    this.deletePortWithId(1,id)
  }

  setPort(type:number,port){
    let targetPorts = (type === 0)?this.getInPorts():this.getOutPorts()
    let hasUpdate = false
    this.ports[type] = targetPorts.map((p)=>{
      if(p.nodeId === port.nodeId){
        //ポートを更新
        hasUpdate = true
        return port
      }
      return p
    })
    //ポートを追加
    if(!hasUpdate)this.ports[type].push(port)
  }

  setInPort(port:[]){
    this.setPort(0,port)
  }

  setOutPort(port:[]){
    this.setPort(1,port)
  }

}