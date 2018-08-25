//@flow
import Model from '../index'

export type FlowModelProps = {
  createdAt : ?string,
  creator: ?string,
  label: string,
  nodes: [],
  params: [],
  ports: [],
  projectId: ?number
}

export default class FlowModel<FlowModelProps> extends Model {
  createdAt = null
  creator = null
  label:string = ""
  params:[] = []
  ports:[] = [[],[]]
  nodes:[] = []
  projectId = null

  constructor (props: FlowModelProps) {
    super(props)
    this.initialize(props,"createdAt")
    this.initialize(props,"creator")
    this.initialize(props,"label")
    this.initialize(props,"params")
    this.initialize(props,"ports")
    this.initialize(props,"nodes")
    this.initialize(props,"projectId")
  }

  getInPorts(){
    return this.ports[0]
  }

  getOutPorts(){
    return this.ports[1]
  }

  getInPortWithId(id){
    const inPorts = this.getInPorts()
    return inPorts.find((port)=>{
      return (port.name === id)
    })
  }

  getOutPortWithId(id){
    const inPorts = this.getOutPorts()
    return inPorts.find((port)=>{
      return (port.name === id)
    })
  }

  hasInPortWithId(id){
    return (this.getInPortWithId(id))?true:false
  }

  hasOutPortWithId(id){
    return (this.getOutPortWithId(id))?true:false
  }
  deletePortWithId(type,id){
    let targetPorts = (type === 0)?this.getInPorts():this.getOutPorts()
    this.ports[type] = targetPorts.filter((port)=>{
      console.log(port.name)
      console.log(id)
      console.log((port.name !== id))
      return (port.name !== id)
    })
  }

  deleteInPortWithId(id){
    this.deletePortWithId(0,id)
  }

  deleteOutPortWithId(id){
    this.deletePortWithId(1,id)
  }

  setPort(type,port){
    let targetPorts = (type === 0)?this.getInPorts():this.getOutPorts()
    let hasUpdate = false
    this.ports[type] = targetPorts.map((p)=>{
      if(p.name === port.name){
        //ポートを更新
        hasUpdate = true
        return port
      }
      return p
    })
    //ポートを追加
    if(!hasUpdate)this.ports[type].push(port)
  }

  setInPort(port){
    this.setPort(0,port)
  }

  setOutPort(port){
    this.setPort(1,port)
  }

}