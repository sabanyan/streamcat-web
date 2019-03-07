//@flow
import React from 'react'
import classnames from 'classnames'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../DataTable/index'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import style from '../style.scss'
import Button from '../../Button/index'
import DownloadButton from '../../Button/DownloadButton/index'
import BaseInspector from '../BaseInspector'
import type { FlowListDataType, StepModelType } from '../../../../types'
import HttpUtil from '../../../../utils/HttpUtil'
import Graph from '../../../../utils/Graph'
import type { CSVModelProps } from '../../../../model/CSV/CSVModel'
import CSVModel from '../../../../model/CSV/CSVModel'
import StringUtil from '../../../../utils/StringUtil'
import Inspector from '../index'
import TabBar from '../../TabBar'
import TabPanel from '../../TabBar/TabPanel'
import TabList from '../../TabBar/TabList'
import Tab from '../../TabBar/Tab'
import type { FlowModelProps } from '../../../../model/Flow/FlowModel'
import moment from 'moment/moment'
import ErrorUtil from '../../../../utils/ErrorUtil'
import APIUtil from '../../../../utils/APIUtil'
import ReactDomUtil from '../../../../utils/ReactDomUtil'
import Run from '../../../FlowEditorContainer/ToolBar/Run'
import AddButton from '../../AddButton'

type Props = {
  project: {};
  onClickRun: Function;
  onClickDelete: Function;
  onClickDuplicate: Function;
  onBlurTitle: Function;
  onClickDeleteParam: Function;
}

class FlowInspector extends React.Component<Props> {

  constructor (props) {
    super(props)
  }

  nullInspector(){
    return <div className={classnames(style.property, style.in)}>
      <BaseInspector {...this.props} >
      </BaseInspector>
    </div>
  }

  renderFlowParameter () {
    const {flow} = this.props
    if(!flow)return null
    const {params} = flow

    let inputParams, inputParamsContainer, addFlowParams
    this.paramRefs = []
    inputParams = params.map((param,index) => {
    return <div key={param.name} className={style.flow_param}>
        <div className={style.left}>
        <input ref={(ref) => {
            //render時にrefがnullのケースでcallされる場合があるので、
            //refがあることを確認してから入れる
            if(ref){
            this.paramRefs.push(ref)
            }
        }} type={'text'} className={'form-control'} defaultValue={param.name} />
        </div>
        <div className={style.right}>
        <Button danger={true} onClick={()=>this.props.onClickDeleteParam(param)}>削除</Button>
        </div>
    </div>
    })
    
    inputParamsContainer = <div>
        <label>フロー変数</label>
        {inputParams}
    </div>
    
    addFlowParams = <AddButton onClick={()=>this.props.onClickAddFlowParam()}>フロー変数を追加する</AddButton>
  
    return <div>
        {inputParamsContainer}
        {addFlowParams}
    </div>
  }

  render () {
    const flow: FlowListDataType = this.props.flow
    if (!flow) {
      return this.nullInspector()
    }
    let content = null
    const uuid = flow.uuid
    const label = flow.label
    const creator = flow.creator
    const createdAt = flow.createdAt
    const description = flow.description
    content = <div>
      <div className={style.actions}>
        <Run disabled={false} icon={'&#xE037'}
        onClick={(e) => this.props.onClickRun()}>フローを実行</Run>
        <Button onClick={() => this.props.onClickDuplicate(uuid)}>複製する</Button>
        <Button danger={true}
                onClick={() => this.props.onClickDelete(uuid)}>削除する</Button>
      </div>
      <div className={style.full_hr}/>
      <div>
        <label>フロー名</label>
      </div>
      <div>
        {label}
      </div>
      <div>
        <label>説明</label>
      </div>
      <div>
        {(description) ? description : '説明がありません'}
      </div>
      <div>
        <label>作成者</label>
      </div>
      <div>
        {creator}
      </div>
      <div>
        <label>作成日時</label>
      </div>
      <div>
        {moment(createdAt).format(Constants.format.dateTime)}
      </div>
      {this.renderFlowParameter()}
    </div>

    return <div className={classnames(style.property, style.in)}>
      <BaseInspector label={label}
                     {...this.props} >
        {content}
      </BaseInspector>
    </div>
  }

}

export default FlowInspector