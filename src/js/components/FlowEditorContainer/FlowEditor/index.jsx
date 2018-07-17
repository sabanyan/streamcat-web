// @flow
import React from 'react'
import Paper from '../Paper'
import PaperScroller from '../PaperScroller'
import Inspector from '../Inspector'
import Step from '../../shared/Step'
import PaperZoom from '../PaperZoom'
import Toolbar from '../ToolBar'
import ModalManager from '../../shared/ModalManager'
import Constants from '../../../constants/index'
import type { FlowEditorProps } from '../index'
import Edge from '../../shared/Edge'
import Selector from '../../shared/Selector'
import style from './style.scss'
import HttpUtil from '../../../utils/HttpUtil'
import Graph from '../../../utils/Graph'

type State = {}

export default class FlowEditor extends React.Component<FlowEditorProps, State> {

  constructor (props: FlowEditorProps) {
    super(props)

    const self = this
    let option = {
      method: 'GET',
      mode: 'same-origin',
      credentials: 'include',
      redirect: 'follow',
    }

    const graph = new Graph()
    HttpUtil.get('flows/' + inject_flow_uuid).then((response) => {
      const json = response.data
      self.props.loadFlowJSON(json.data)
    })

    HttpUtil.get('commands').then((response) => {
      const json = response.data
      self.props.addMaster({commands: json.data})
    }).then((response) => {console.log(response)},
      (error) => {console.log(error)})
    //
    // fetch("http://" + Constants.api.host + "/api/v0-1/operators",
    // option).then(function (response) { if (response.ok) { return
    // response.json() } else { alert("サーバでエラーが発生しました") } }).then(function
    // (json: any) { //マスタ追加 self.props.addMaster({operators: json.data})
    // }).catch((err) => { console.log(err) alert("クライアントでエラーが発生しました") })

  }

  render () {

    let {selected_step_ids,nodes} = this.props
    const self = this
    //this.props.state.stepsを生成する
    const steps = Object.keys(nodes).map((node_name) => {
      let step = nodes[node_name]
      let selected = (node_name === selected_step_ids[0])
      return <Step key={step.id} {...step} model={step} {...self.props}
                   selected={selected} />
    })
    let edges = []

    if (Array.isArray(this.props.edges)) {
      edges = this.props.edges.map(function (edge, index) {
        const vx = nodes[edge.v].position.x +
          Constants.default.datasource.width / 2
        const vy = nodes[edge.v].position.y +
          Constants.default.datasource.height / 2
        const wx = nodes[edge.w].position.x +
          Constants.default.operator.width / 2
        const wy = nodes[edge.w].position.y +
          Constants.default.operator.height / 2
        const name = edge.name
        return <Edge label={name} vx={vx} vy={vy} wx={wx} wy={wy} key={index} />
      })
    }

    let selector = null
    const {drag} = this.props
    if (Object.keys(drag).length) {
      selector = <Selector sx={drag.start.x} sy={drag.start.y} ex={drag.end.x}
                           ey={drag.end.y} />
    }

    return <div className={style.flow_editor}>
      <PaperZoom />
      <Toolbar {...this.props} />
      <PaperScroller {...this.props}>
        <Paper {...this.props}>
          {edges}
          {steps}
          {selector}
        </Paper>
      </PaperScroller>
      <Inspector {...this.props} />
      <ModalManager />
    </div>
  }
}