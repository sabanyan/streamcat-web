//@flow
import React from 'react'
import VisualizeModel from '../../../model/Visualize/VisualizeModel'
import HttpUtil from '../../../utils/HttpUtil'
import EmptyState from '../EmptyState'
import Loader from '../Loader'
import PreviewInspector from '../Inspector/PreviewInspector'
import classnames from 'classnames'
import style from './style.scss'
import ParamUtil from '../../../utils/ParamUtil'

type Props = {
  visualize: VisualizeModel,
  params: VisualizeParams;
  frame_uuid: string;
}

type State = {
  html?: any;
  args: {};
  is_loading:true;
}

export default class Visualizer extends React.Component<Props,State> {
  inputRefs: any[]

  constructor (props: Props) {
    super(props)
    this.inputRefs = []
    this.state = {
      html: null,
      args: {},
      is_loading:true
    }
  }

  componentWillMount () {
    this.visualizeRequest(this.props.visualize,{})
  }

  visualizeRequest(visualize:VisualizeModel,args:{}){

    //TODO 引数のargs,uuidに置き換える
    const uuid = this.props.frame_uuid
    const body ={ "args": args, "inputs": { "i": uuid } }
    this.setState({is_loading:true})
    HttpUtil.post("visualizers?from=" + visualize.id,body).then((res)=>{
      this.setState({html:res.data,is_loading:false})
    }).catch((error)=>{
      if(error){
        this.setState({is_loading:false})
      }
    })
  }

  onSave(args:{}){
    console.log(args)
    this.setState({args:args})
    this.visualizeRequest(this.props.visualize,args)
  }


  render () {
    const {visualize} = this.props
    if(this.state.is_loading){
      return <Loader center={true} visible={true}/>
    }
    const args = this.state.args
    if(!this.state.html){
      return <div>
        <EmptyState title={"表示することができません"} description={""} icon={"cloud_off"}/>
        <PreviewInspector onSave={(args)=>this.onSave(args)} params={visualize.params} args = {args} label={visualize.label}/>
      </div>

    }
    return <div>
      <div className={style.visualizeContainer}>
        <div dangerouslySetInnerHTML={{__html: this.state.html}}></div>
      </div>
      <PreviewInspector onSave={(args)=>this.onSave(args)} params={visualize.params} args = {args} label={visualize.label}/>
    </div>
  }

}