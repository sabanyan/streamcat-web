//@flow
import React from 'react'
import BaseInspector from '../BaseInspector/index'
import style from '../style.scss'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import Button from '../../Button/index'
import FlowUtil from '../../../../utils/FlowUtil'
import classnames from 'classnames'
import HttpUtil from '../../../../utils/HttpUtil'
import ModalUtil from '../../../../utils/ModalUtil'
import Constants from '../../../../constants'

class FlowSettingsInspector extends React.Component<FlowEditorProps, State> {

  loading: boolean = false

  constructor (props: FlowEditorProps) {
    super(props)
  }

  componentWillMount () {

  }

  onClickSave (e: Event) {
    const {flow} = this.props
    const {label} = this.props.flow
    flow.description = this.refs['description'].value
    this.props.updateFlow(flow)
    FlowUtil.saveFlowSettings(inject_flow_uuid, {label: label, description: flow.description,params:flow.params})
    this.props.selectSteps()
  }

  onBlurTitle (e: SyntheticInputEvent<EventTarget>) {
    let {flow} = this.props
    flow.label = e.target.value
    this.props.updateFlow(flow)
  }

  onClickAddFlowParam(){
    let {flow} = this.props
    flow.params.push({name:"new_param",type:"string"})
    this.props.updateFlow(flow)
  }

  onDeleteParam(param){
    let {flow} = this.props
    let newParams = []
    flow.params.forEach((p)=>{
      if(p !== param)newParams.push(p)
    })
    flow.params = newParams
    this.props.updateFlow(flow)
  }

  onClickDeleteParam(param){

    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        this.onDeleteParam(param)
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたフロー変数を削除しますか？
      </div>,
    })
  }

  render () {
    const {flow} = this.props
    const {params} = this.props.flow

    let inputParams, inputParamsContainer, addFlowParams
    inputParams = params.map((param) => {
      return <div className={style.flow_param}>
        <div className={style.left}>
          <input type={'text'} className={'form-control'} defaultValue={param.name} />
        </div>
        <div className={style.right}>
          <Button danger={true} onClick={()=>this.onClickDeleteParam(param)}>削除</Button>
        </div>
      </div>
    })

    if (inputParams) {
      inputParamsContainer = <div>
        <div className={style.full_hr} />
        <label>フロー変数</label>
        {inputParams}
      </div>
    } else {
      <div>
        フロー変数の設定がありません
      </div>
    }
    addFlowParams = <div className={style.new_flow_params} onClick={()=>this.onClickAddFlowParam()}>
      <i className={classnames('material-icons', [style.new_flow_params_icon])}>add_circle_outline</i>
      フロー変数を追加する
    </div>

    return <BaseInspector header={''} label={this.props.flow.label} name={''} {...this.props}
                          onBlurTitle={(e) => this.onBlurTitle(e)}>
      <textarea className={'mb-8px'} placeholder={'フローの説明'} className={'form-control'} ref={'description'}
                defaultValue={this.props.flow.description} rows={8} onBlur={this.onBlurDescription}></textarea>
      {inputParamsContainer}
      {addFlowParams}
      <div>
        <div className={style.full_hr} />
        <Button onClick={(e) => this.onClickSave(e)}>適用</Button>
      </div>
    </BaseInspector>
  }
}

export default FlowSettingsInspector