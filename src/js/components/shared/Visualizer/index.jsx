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
  headers:[]
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
      html: (props.result) ? props.result.html : null,
      args: (props.result) ? props.result.args : {},
      is_loading:(props.result) ? false : true
    }
  }

  componentWillMount () {
    const result = this.props.result
    if (result) {
      this.setState({})
    } else if(this.props.visualize){
      const args = this.getDefaultArgs(this.props.visualize.params)
      this.visualizeRequest(this.props.visualize,args)
    }
  }

  getDefaultArgs(params:[]) {
    let args = {}
    params.map((param) => {
      if(param.default) {
        args[param.name] = param.default
      }  
    })
    return args
 }

  visualizeRequest(visualize:VisualizeModel,args:{}){

    const uuid = this.props.frame_uuid
    const body ={ "args": args, "inputs": { "i": uuid }}
    // 現在Limitはクエリパラメーターではなく、Bodyのargs{limit:}を使ってるため
    //const limit = this.getLimitWhenCsvToHTMLTable(visualize.id)

    this.setState({is_loading:true})
    HttpUtil.post("visualizers?from=" + visualize.id,body).then((res)=>{
      this.setState({html:res.data,is_loading:false})
      // 結果を保存
      if(this.props.onSaveResult) {
        const index = this.props.index
        const result = {
          html:this.state.html,
          args:this.state.args
        }
        this.props.onSaveResult(index, result)
      }    
    }).catch((error)=>{
      if(error){
        this.setState({is_loading:false})
      }
    })
  }

  /**
   * csvtothmlttableのときのみlimitをつける
   * @param id
   * @returns {string}
   */
  getLimitWhenCsvToHTMLTable(id:string){
    if(id === "csvtohtmltable"){
      return "&limit=1000"
    }
    return ""
  }

  onSave(args:{}){
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
    const {visualize,headers, frame_uuid} = this.props
    const args = this.state.args
    const is_loading = this.state.is_loading
    const html = this.state.html

    if(is_loading){
      return <Loader center={true} visible={true}/>
    }
    if(!this.state.html){
      return <div>
        <EmptyState title={"表示することができません"} description={"条件を変更して反映ボタンを押してください"} icon={"cloud_off"}/>
        <PreviewInspector key={"perview_" + visualize.label + frame_uuid} headers={headers} onSave={(args)=>this.onSave(args)} params={visualize.params} args = {args} label={visualize.label}/>
      </div>

    }

    return <div>
      <div className={style.visualizeContainer}>
        <div dangerouslySetInnerHTML={{__html: this.state.html}}></div>
      </div>
      <PreviewInspector headers={headers}  onSave={(args)=>this.onSave(args)} params={visualize.params} args = {args} label={visualize.label}/>
    </div>
  }

}
