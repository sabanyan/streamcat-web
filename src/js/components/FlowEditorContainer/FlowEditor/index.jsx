// @flow
import React from 'react'
import Paper from '../Paper'
import PaperScroller from '../PaperScroller'
import Property from '../Inspector'
import Step from '../../shared/Step'
import PaperZoom from '../PaperZoom'
import Toolbar from '../Toolbar'
import ModalManager from '../../shared/ModalManager'
import Constants from '../../../constants/index'
import Tab from '../../shared/TabBar/Tab'
import TabPanel from '../../shared/TabBar/TabPanel'
import TabList from '../../shared/TabBar/TabList'
import TabBar from '../../shared/TabBar'
import DataTable from '../../shared/DataTable'
import type {FlowEditorProps} from '../index'
import Edge from '../../shared/Edge'
import Selector from '../../shared/Selector'

type State = {}

export default class FlowEditor extends React.Component<FlowEditorProps, State> {

  constructor (props: Props) {
    super(props)

    const self = this
    let option = {
      method: 'GET',
      mode: 'same-origin',
      credentials: 'include',
      redirect: 'follow',
    }

    fetch("http://" + Constants.api.host + "/api/v0-1/operators", option).then(function (response) {
      if (response.ok) {
        return response.json()
      } else {
        alert("サーバでエラーが発生しました")
      }
    }).then(function (json: any) {
      //マスタ追加
      self.props.addMaster({operators: json.data})
    }).catch((err) => {
      console.log(err)
      alert("クライアントでエラーが発生しました")
    })

  }

  render () {

    let {selected_step_ids} = this.props
    const self = this

    //this.props.state.stepsを生成する
    const steps = Object.keys(this.props.steps).map((node_name) => {
      let step = self.props.steps[node_name]
      let selected = (node_name === selected_step_ids[0])
      return <Step key={step.id} {...step} model={step} {...self.props} selected={selected} />
    })
    let edges = []

    if (Array.isArray(this.props.edges)) {
      edges = this.props.edges.map(function (edge, index) {
        const vx = self.props.steps[edge.v].position.x + Constants.default.datasource.width / 2
        const vy = self.props.steps[edge.v].position.y + Constants.default.datasource.height / 2
        const wx = self.props.steps[edge.w].position.x + Constants.default.operator.width / 2
        const wy = self.props.steps[edge.w].position.y + Constants.default.operator.height / 2
        return <Edge vx={vx} vy={vy} wx={wx} wy={wy} key={index} />
      })
    }

    let selector = null
    const {drag} = this.props
    if(Object.keys(drag).length){
     selector= <Selector sx={drag.start.x} sy={drag.start.y} ex={drag.end.x} ey={drag.end.y}></Selector>
    }

    return <div>
        <PaperZoom />
        <Toolbar {...this.props} />
        <PaperScroller {...this.props}>
          <Paper {...this.props}>
            {edges}
            {steps}
            {selector}
          </Paper>
        </PaperScroller>
        <Property {...this.props} />
        <ModalManager />
    </div>
  }
}