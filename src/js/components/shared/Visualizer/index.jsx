//@flow
import * as React from 'react'
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
//    const body ={
//      "args":{
//        "limit": "",
//        "offset": "",
//        "x_size": 1400,
//        "y_size": 600,
//        "graph_title": "テスト（折れ線グラフ）",
//        "x_label": "日付",
//        "y_label": "気温",
//        "alpha": 1,
//        "time_series_column": ["date"],
//        "x_axis_column": "date",
//        "y_axis_column": "average",
//        "data_column": "prefecture",
//        "data": []
//      },
//      "inputs":{
//        "i": "result3"
//      }
//    }

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

  componentDidUpdate(){
    //visualizeRequestで取得したhtml内のscriptがrenderされた後にscriptを再取得
    const scripts = $(".visualize-component").find("script")
    if(scripts[0]){
      //再度appendし直してjsを実行させる
      this.innerHTMLScriptReLaunch(scripts[0])
    }
  }

  /**
   * innerHTMLのscriptをappendし直して実行させる
   * @param script
   */
  innerHTMLScriptReLaunch(script){
    var s = document.createElement("script")
    script.src ? (s.src = script.src) : (s.innerHTML = script.innerHTML)
    s.async = false
    document.head.append(s)
    s.remove()
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