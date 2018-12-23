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
import type { SubFlowParamType } from '../../../../types'
import AddButton from '../../AddButton'

class FlowSettingsInspector extends React.Component<FlowEditorProps, State> {

  paramRefs:[] = []
  loading: boolean = false

  constructor (props: FlowEditorProps) {
    super(props)
  }

  componentWillMount () {

  }

  onSave (e: Event) {
    const {flow} = this.props
    const {label} = this.props.flow
    flow.description = this.refs['description'].value
    flow.params = this.getCurrentParams()
    this.props.updateFlow(flow)
    FlowUtil.saveFlowSettings(inject_flow_uuid, {label: label, description: flow.description,params:flow.params})
    this.props.selectSteps()
  }

  getCurrentParams(){
    //現在入力中のすべてのParamsを取得する
    let params = []
    this.paramRefs.forEach(elem=>{
      let param:SubFlowParamType = {}
      param["name"] = elem.value
      param["type"] = "string"
      params.push(param)
    })
    return params
  }

  onBlurTitle (e: SyntheticInputEvent<EventTarget>) {
    let {flow} = this.props
    flow.label = e.target.value
    this.props.updateFlow(flow)
  }

  onClickAddFlowParam(){
    let {flow} = this.props
    const name = this.setNewParamName("new_param",1)
    flow.params.push({name:name,type:"string"})
    this.props.updateFlow(flow)
  }

  setNewParamName(name:string,cnt:number):string{
    let {flow} = this.props

    const findResult = flow.params.find(param=>{
      return param.name === (name + cnt)
    })
    if(findResult){
      return this.setNewParamName(name,cnt+1)
    }
    return name + cnt
  }


  onDeleteParam(param){
    let {flow} = this.props
    const newParams = flow.params.filter(p=>{
      return(p !== param)
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
    addFlowParams = <AddButton onClick={()=>this.onClickAddFlowParam()}>フロー変数を追加する</AddButton>

    return <BaseInspector header={''} label={this.props.flow.label} name={''} {...this.props}
                          onBlurTitle={(e) => this.onBlurTitle(e)} onHide={()=>this.onSave()}>
      <textarea className={'mb-8px'} placeholder={'フローの説明'} className={'form-control'} ref={'description'}
                defaultValue={this.props.flow.description} rows={8} onBlur={this.onBlurDescription}></textarea>
      {inputParamsContainer}
      {addFlowParams}
      {/*<div>*/}
        {/*<div className={style.full_hr} />*/}
        {/*<Button onClick={(e) => this.onClickSave(e)}>適用</Button>*/}
      {/*</div>*/}
    </BaseInspector>
  }
}

export default FlowSettingsInspector