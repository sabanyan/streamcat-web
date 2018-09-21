//@flow
import React from 'react'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import Operator from '../../Command/index'
import BaseInspector from '../BaseInspector/index'
import style from '../style.scss'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import Button from '../../Button/index'
import DataPreview from '../../DataPreview/index'
import DropDownList from '../../DropDownList/index'
import DataFrameStepModel from '../../../../model/Step/DataFrameStepModel'
import CommandSelector from '../../CommandSelector/index'
import FlowModel from '../../../../model/Flow/FlowModel'
import Graph from '../../../../utils/Graph'
import HttpUtil from '../../../../utils/HttpUtil'
import type { DataFrameDetailType, StepModelType } from '../../../../types/index'
import type { CSVModelProps } from '../../../../model/CSV/CSVModel'
import CSVModel from '../../../../model/CSV/CSVModel'
import Loader from '../../Loader/index'
import FlowUtil from '../../../../utils/FlowUtil'
import ChartUtil from '../../../../utils/ChartUtil'
import DataTable from '../../DataTable/index'
import StateUtil from '../../../../utils/State'
import StringUtil from '../../../../utils/StringUtil'
import type { FlowModelProps } from '../../../../model/Flow/FlowModel'

class FlowSettingsInspector extends React.Component<FlowEditorProps,State> {


  loading:boolean = false

  constructor (props:FlowEditorProps){
    super(props)
  }

  componentWillMount () {

  }

  onClickSave (e:Event) {
    const {flow} = this.props
    const {label} = this.props.flow
    flow.description = this.refs["description"].value
    this.props.updateFlow(flow)
    FlowUtil.saveFlowSettings(inject_flow_uuid,{label:label,description:flow.description})
    this.props.selectSteps()
  }

  onBlurTitle(e:SyntheticInputEvent<EventTarget>){
    let {flow} = this.props
    flow.label = e.target.value
    this.props.updateFlow(flow)
  }

  render () {
    console.log(this.props.flow)
    return <BaseInspector header={""}  label={this.props.flow.label} name={""} {...this.props} onBlurTitle={(e)=>this.onBlurTitle(e)}>

      <textarea placeholder={"フローの説明"} className={"form-control"} ref={"description"} defaultValue={this.props.flow.description} rows={8}></textarea>
      <div>
        <div className={style.full_hr} />
        <Button onClick={(e) => this.onClickSave(e)}>適用</Button>
      </div>
    </BaseInspector>
  }
}

export default FlowSettingsInspector