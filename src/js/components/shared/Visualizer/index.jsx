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
    const example_args = { "limit": "", "offset": "", "columns": ["temperature"], "x_inch": 7, "y_inch": 3, "x_axis": "Time", "time_series_column": ["Time"] }
    const example_uuid = "f20541d4-8b8f-4787-6ea9-f1e9d3db80a1"

    const body ={ "args": example_args, "inputs": { "i": example_uuid } }
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
      <PreviewInspector params={visualize.params} args = {args} label={visualize.label}/>
    </div>
  }

}