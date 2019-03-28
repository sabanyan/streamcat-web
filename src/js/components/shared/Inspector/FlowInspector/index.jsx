//@flow
import React from 'react'
import classnames from 'classnames'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import style from '../style.scss'
import Button from '../../Button/index'
import DownloadButton from '../../Button/DownloadButton/index'
import BaseInspector from '../BaseInspector'
import type { FlowListDataType, StepModelType } from '../../../../types'
import type { CSVModelProps } from '../../../../model/CSV/CSVModel'
import type { FlowModelProps } from '../../../../model/Flow/FlowModel'
import moment from 'moment/moment'
import ReactDomUtil from '../../../../utils/ReactDomUtil'
import Run from '../../../FlowEditorContainer/ToolBar/Run'
import FlowUtil from '../../../../utils/FlowUtil';
import AddButton from '../../AddButton/index'
import HttpUtil from '../../../../utils/HttpUtil'
import InputFlowForm from '../../InputFlowForm'

type Props = {
  project: {};
  onClickRun: Function;
  onClickDelete: Function;
  onClickDuplicate: Function;
  onBlurTitle: Function;
  onClickDeleteParam: Function;
}


class FlowInspector extends React.Component<Props, State> {
  constructor (props) {
    super(props)
    this.argRefs = []
    this.inputRefs = []

    ModalUtil.registerModal({
      id: Constants.modal.RUN_FLOW, onClickDone: () => {
        this.run()
        //モーダルを閉じる
        ModalUtil.closeModal(Constants.modal.RUN_FLOW)
      },
    })
  }

  nullInspector(){
    return <div className={classnames(style.property, style.in)}>
      <BaseInspector {...this.props} >
      </BaseInspector>
    </div>
  }

  onClickRun () {
    let contents = {
      flow : this.props.flow,
      run : (runArgs) => this.runFlow(), 
      parentProps : this.props
    }

    ModalUtil.emitModal({
      id: Constants.modal.RUN_FLOW,
      visible: true,
      done: '実行する',
      cancle: 'キャンセル',
      danger: false,
      contents: contents,
    })
  }



  renderFlowVariableForm() {
    const {params} = this.props.flow
    this.argRefs = []
    let form = params.map((param) => {
      return <div key={"param_"+param.name} className={style.flow_param}>
                <div className={style.left}>
                  <input ref={(ref) => {
                    if(ref){
                      this.argRefs.push({param:param, element:ref})
                    }
                  }} 
                  type={'text'} className={'form-control'} placeholder={param.name} />
                </div>
                <div className={style.right}>
              </div>
            </div>
    })

    return <div>
      <label>フロー変数</label>
      {form}
    </div>
  }

  renderInputFile() {
    const inputFileContainer = <div>
        <label>入力ファイル</label>
    </div>

    return inputFileContainer
  }

  renderFlowParameter () {
    const {flow} = this.props
    if(!flow)return null

    let {params} = flow
    let inputParams, inputParamsContainer, addFlowParams
    this.paramRefs = []
    inputParams = params.map((param) => {
      return <div key={param.name} className={style.flow_param}>
          <div className={style.left}>
          <input ref={(ref) => {
              //render時にrefがnullのケースでcallされる場合があるので、
              //refがあることを確認してから入れる
              if(ref){
              this.paramRefs.push({param:param, element:ref})
              }
          }} type={'text'} className={'form-control'} defaultValue={param.name} />
          </div>
          <div className={style.right}>
          {/*<Button danger={true} onClick={()=>this.props.onClickDeleteParam(param)}>削除</Button>*/}
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
        {/*addFlowParams*/}
    </div>
  }

  run (runArgs) {
    let putbody = {}
    const params = []
    this.paramRefs.map((paramRef) => {
      params.push({name:paramRef.element.value, type:paramRef.param.type})  
    })
    const flow_uuid = this.props.flow.uuid
    if(params)putbody["params"]=params
    const notify = this.props.notify
    const dismissNotify = this.props.dismissNotify
    FlowUtil.runNodes(flow_uuid, notify, dismissNotify).then((response) => {
      if (response.data.success) {
        const json: RunResponseType = response.data
        const result = json.name.map((n, index) => {
          return <li key={index}>{n.id}</li>
        })
        const content = <div>
          <div>ライブラリにフローの実行結果が追加されました。</div>
          <ul>{result}</ul>
        </div>

        this.props.notify({
          title: 'フロー実行完了',
          message: ReactDomUtil.renderToString(content),
          status: 'success',
          dismissAfter: 0,
          buttons: [
            {
              name: '開く',
              primary: true,
              onClick: () => {
                window.open('/library?project=' +
                  window.navigationModel.project_uuid, '_blank')
              },
            }],
        })
      }
    })
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
        <Run disabled={false}
        onClick={(e) => this.onClickRun()}>フローを実行</Run>
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