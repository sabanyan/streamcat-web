//@flow
import React from 'react'
import BaseInspector from 'Shared/Inspector/BaseInspector/index'
import style from '../style.scss'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import { AddButton, Button } from 'Shared/Input'
import ModalUtil from 'Utils/ModalUtil'
import Constants from 'Constants/index'
import type { SubFlowParamType } from 'Types/index'
import CommandSelector from 'Shared/CommandSelector'

class FlowSettingsInspector extends React.Component<FlowEditorProps, State> {
  paramRefs: [] = []
  loading: boolean = false

  constructor (props: FlowEditorProps) {
    super(props)
  }

  componentWillMount () {

  }

  onHide (e: Event) {
    const {flow, notify, dismissNotify} = this.props
    const {label} = this.props.flow

    const beforeFlow = Object.assign({}, {...flow})

    flow.description = this.refs['description'].value
    flow.params = this.getCurrentParams()

    this.props.updateFlow(flow)
  }

  getCurrentParams () {
    //現在入力中のすべてのParamsを取得する
    let params = []
    this.paramRefs.forEach(elem => {
      let param: SubFlowParamType = {}
      param['name'] = elem.value
      param['type'] = 'string'
      params.push(param)
    })
    return params
  }

  onBlurTitle (e: SyntheticInputEvent<EventTarget>) {
    let {flow} = this.props
    flow.label = e.target.value
    this.props.updateFlow(flow)
  }

  onClickAddFlowParam () {
    let {flow} = this.props
    const name = this.setNewParamName('new_param', 1)
    flow.params.push({name: name, type: 'string'})
    this.props.updateFlow(flow)
  }

  setNewParamName (name: string, cnt: number): string {
    let {flow} = this.props

    const findResult = flow.params.find(param => {
      return param.name === (name + cnt)
    })
    if (findResult) {
      return this.setNewParamName(name, cnt + 1)
    }
    return name + cnt
  }

  onDeleteParam (param) {
    let {flow} = this.props
    const newParams = flow.params.filter(p => {
      return (p !== param)
    })
    flow.params = newParams
    this.props.updateFlow(flow)
  }

  onClickDeleteParam (param) {

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

  onDescriptionChange (e) {
    let {flow} = this.props
    flow.description = e.currentTarget.value
    this.props.updateFlow(flow)
  }

  onParamChange (e) {
    let {flow} = this.props
    let params = this.getCurrentParams()
    flow.params = params
    this.props.updateFlow(flow)
  }

  render () {
    const {flow} = this.props
    if (!flow) return null
    const {params} = flow

    let inputParams, inputParamsContainer, addFlowParams
    this.paramRefs = []
    inputParams = params.map((param, index) => {
      return <div key={index + 'param'} className={style.flow_param}>
        <div className={style.left}>
          <input ref={(ref) => {
            //render時にrefがnullのケースでcallされる場合があるので、
            //refがあることを確認してから入れる
            if (ref) {
              this.paramRefs.push(ref)
            }
          }} type={'text'} className={'form-control'} defaultValue={param.name}
                 onChange={(e) => {this.onParamChange(e)}} />
        </div>
        <div className={style.right}>
          <Button danger={true} onClick={() => this.onClickDeleteParam(param)}>削除</Button>
        </div>
      </div>
    })

    if (inputParams) {
      inputParamsContainer = <div>
        <label>フロー変数</label>
        {inputParams}
      </div>
    } else {
      <div>
        フロー変数の設定がありません
      </div>
    }
    addFlowParams = <AddButton onClick={() => this.onClickAddFlowParam()}>フロー変数を追加する</AddButton>

    return <BaseInspector header={''} label={this.props.flow.label} {...this.props}
                          onBlurTitle={(e) => this.onBlurTitle(e)} onHide={() => this.onHide()}>
      <textarea className={'mb-8px'} placeholder={'フローの説明'} className={'form-control'} ref={'description'}
                defaultValue={this.props.flow.description} rows={8}
                onChange={(e) => this.onDescriptionChange(e)}></textarea>
      {inputParamsContainer}
      {addFlowParams}
      <div className={style.full_hr} />
      <CommandSelector numberOfInput={0} {...this.props} />
    </BaseInspector>
  }
}

export default FlowSettingsInspector