//@flow
import React from 'react'
import Paper from '../Paper'
import PaperScroller from '../PaperScroller'
import Step from '../../shared/Step'
import PaperZoom from '../PaperZoom'
import ToolBar from '../ToolBar'
import ModalManager from '../../shared/ModalManager'
import Constants from '../../../constants/index'
import type { FlowEditorProps } from '../index'
import Edge from '../../shared/Edge'
import Selector from '../../shared/Selector'
import style from './style.scss'
import APIUtil from '../../../utils/APIUtil'
import Graph from '../../../utils/Graph'
import ZoomUtil from '../../../utils/ZoomUtil'
import CommandModel from '../../../model/Command/CommandModel'
import Loader from '../../shared/Loader'
import type { SubFlowParamType } from '../../../types'
import Inspector from '../../shared/Inspector'
import SubflowCommandModel from '../../../model/Command/SubflowCommandModel'
import VisualizeModel from '../../../model/Visualize/VisualizeModel'
import NotificationManager from '../../shared/NotificationManager'

type State = {}

export default class FlowEditor extends React.Component<FlowEditorProps, State> {

  loaded:boolean = false

  constructor (props: FlowEditorProps) {
    super(props)

    let option = {
      method: 'GET',
      mode: 'same-origin',
      credentials: 'include',
      redirect: 'follow',
    }

    const graph:Graph = new Graph()

    let preRequest = []
    let flowRequest = []

    window.emitter.removeListener(Constants.event.ON_LOAD_NAVIGATION)
    window.emitter.addListener(Constants.event.ON_LOAD_NAVIGATION,
      (context) => {
        preRequest.push(APIUtil.get('flows?project='+window.navigationModel.project_uuid+'&navigation=off').then((response) => {
          const json = response.data
          // const commands = json.data.map((command)=>{
          //   return new CommandModel(command)
          // })
          // this.props.addMaster({commands: commands})
        }).then((response) => {},
          (error) => {console.log(error)}))
      })

    preRequest.push(APIUtil.get('commands').then((response) => {
      const json = response.data
      const commands = json.data.map((command)=>{
        return new CommandModel(command)
      })
      window.commands = commands
      this.props.addMaster({commands: commands})
    }).then((response) => {},
      (error) => {console.log(error)}))


    preRequest.push(APIUtil.get('visualizers').then((response) => {
      const json = response.data
      const visualizers = json.data.map((visualize)=>{
        return new VisualizeModel(visualize)
      })
      window.visualizers = visualizers
      this.props.addMaster({visualizers: visualizers})
    }).then((response) => {},
      (error) => {console.log(error)}))


    preRequest.push(APIUtil.get('subflows').then((response) => {
      const json = response.data
      const subflows = json.data.map((subflow:SubFlowParamType)=>{
        return new SubflowCommandModel(subflow)
      })
      window.subflows = subflows
      this.props.addMaster({subflows: subflows})
    }).then((response) => {},
      (error) => {console.log(error)}))

    Promise.all(preRequest).then(()=>{
      flowRequest.push(APIUtil.get('flows/' + inject_flow_uuid).then((response) => {
        const json = response.data
        this.props.loadFlowJSON(json)
      }))
    }).catch((error)=>{
      console.log(error)
    })

    Promise.all(flowRequest).then(()=>{
      this.loaded = true
      this.forceUpdate()
    }).catch((error)=>{
      console.log(error)
    })

    //
    // fetch("http://" + Constants.api.host + "/api/v0-1/operators",
    // option).then(function (response) { if (response.ok) { return
    // response.json() } else { alert("サーバでエラーが発生しました") } }).then(function
    // (json: any) { //マスタ追加 self.props.addMaster({operators: json.data})
    // }).catch((err) => { console.log(err) alert("クライアントでエラーが発生しました") })

  }

  renderSteps(){
    let {nodes,selected_step_ids} = this.props
    let steps = []
    if (Array.isArray(nodes)) {
      steps = nodes.map((step) => {
        let selected = (step.id === selected_step_ids[0])
        return <Step key={step.id} {...step} model={step} {...this.props}
                     selected={selected} />
      })
    }
    return steps
  }

  renderEdges(){
    let {nodes,graph} = this.props
    let edges = []

    if (Array.isArray(graph.edges)) {
      edges = graph.edges.map((edge, index)=> {
        const v_node = Graph.getNode(nodes,edge.v)
        const w_node = Graph.getNode(nodes,edge.w)
        if(v_node && w_node){
          const vx = v_node.position.x +
            Constants.default.datasource.width / 2
          const vy = v_node.position.y +
            Constants.default.datasource.height / 2
          const wx = w_node.position.x +
            Constants.default.operator.width / 2
          const wy = w_node.position.y +
            Constants.default.operator.height / 2
          const name = edge.v + "->" + edge.w
          return <Edge label={name} vx={vx} vy={vy} wx={wx} wy={wy} key={index} />
        }
      })
    }
    return edges
  }

  renderSelector(){
    let selector = null
    const {drag,zoom} = this.props
    if (Object.keys(drag).length) {
      selector = <Selector sx={ZoomUtil.zoomReverse(drag.start.x,zoom)}
                           sy={ZoomUtil.zoomReverse(drag.start.y,zoom)}
                           ex={ZoomUtil.zoomReverse(drag.end.x,zoom)}
                           ey={ZoomUtil.zoomReverse(drag.end.y,zoom)} />
    }
    return selector
  }

  render () {
    return <div className={style.flow_editor_container}>
      <div className={style.flow_editor}>
      <PaperZoom />
      {/*<SettingsButton {...this.props}/>*/}
      <ToolBar {...this.props} />
      <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={!(this.loaded)} message={"フローを構築中です"}/>
      <PaperScroller {...this.props}>
        <Paper {...this.props}>
          {this.renderEdges()}f
          {this.renderSteps()}
          {this.renderSelector()}
        </Paper>
      </PaperScroller>
      <Inspector {...this.props} />
      <ModalManager />
        <NotificationManager />
    </div>
    </div>
  }
}