import React from 'react'
import PropTypes from 'prop-types'
import PaperContainer from '../../../containers/PaperContainer'
import PaperScrollerContainer from '../../../containers/PaperScrollerContainer'
import PropertyContainer from '../../../containers/PropertyContainer'
import Step from '../../Step'
import CanvasZoom from '../../CanvasZoom'
import ProjectRun from '../../ProjectRun'
import BaseComponent from '../../BaseComponent'
import ModalManager from '../../ModalManager'
import Constants from '../../../constants/index'

export default class FlowEditor extends BaseComponent{

  constructor (props){
    super(props)

    const self = this
    let option = {
      method: 'GET',
      mode: 'same-origin',
      credentials: 'include',
      redirect: 'follow',
    }

    fetch("http://"+Constants.api.host+"/api/v0-1/operators", option).then(function (response) {
      if (response.ok) {
        return response.json()
      } else {
        alert("サーバでエラーが発生しました")
      }
    }).then(function (json) {
      //マスタ追加
      self.props.addMaster({operators:json.data})
    }).catch((err) => {
      console.log(err)
      alert("クライアントでエラーが発生しました")
    })

  }

  render () {

    let {selected_step_ids} = this.props
    const {steps} = this.props
    //this.props.state.stepsを生成する
    const flows = Object.keys(steps).map((node_name) => {
      let step = steps[node_name]
      let selected = (node_name === selected_step_ids[0])
      return <Step key={step.id} {...step} model={step} {...this.props} selected={selected}/>
    })
    let edges = []

    if (Array.isArray(this.props.edges)) {
      edges = this.props.edges.map(function (edge,index) {
        const vx = steps[edge.v].position.x + 80 / 2
        const vy = steps[edge.v].position.y + 80 / 2
        const wx = steps[edge.w].position.x + 80 / 2
        const wy = steps[edge.w].position.y + 80 / 2
        return <path key={"path"+index} d={"M" + vx + "," + vy + " " + "L" + wx + "," + wy} stroke="gray" strokeWidth="1" />
      })
    }


    return <div>
      <div className="d-flex align-items-stretch">
      <CanvasZoom {...this.props} />
      <ProjectRun {...this.props}/>
      <PaperScrollerContainer>
        <PaperContainer>
          {edges}
          {flows}
        </PaperContainer>
      </PaperScrollerContainer>
      <PropertyContainer/>
      <ModalManager/>
    </div>
    </div>
  }
}