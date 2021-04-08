import React, { Fragment } from 'react'
import { BaseInspector } from 'Shared/Inspector'
import style from '../style.scss'
import { AddButton, Button } from 'Shared/Input'
import { ModalUtil,StringUtil } from 'Utils/index'
import Constants from 'Constants/index'
import { CommandSelector } from 'FlowEditorContainer/Command'
import { MastType } from 'Types/index'
import { FlowModelProps } from "Model/Flow/FlowModel"

type Props = {
  mast: MastType;
  selected_step_ids: [];
  addStep: Function;
  selectSteps: Function;
  flow: FlowModelProps;
  updateFlow: Function;
  addHistory: Function;
  addFlowVariableHidden: boolean;
  commandSelectorHidden: boolean;
  baseInspectorDisabled: boolean;
}

class FlowSettingsInspector extends React.Component<Props> {
  paramRefs: [] = []
  loading: boolean = false

  constructor (props: Props) {
    super(props)

  }

  componentWillMount () {

  }

  /*
  getCurrentParams () {
    //現在入力中のすべてのParamsを取得する
    let params = []
    this.paramRefs.forEach(elem => {
      let param: SubFlowParamType = {}
      param['label'] = elem.value
      param['name'] = elem.value
      param['uuid'] = elem.uuid
      param['type'] = 'string'
      params.push(param)
    })
    return params
  }

  onHide (e: Event) {
    const {flow} = this.props
    const {label} = this.props.flow

    const beforeFlow = Object.assign({}, {...flow})

    flow.description = this.refs['description'].value
    flow.params = this.getCurrentParams()

    //this.props.updateFlow(flow)
  }
  */

  onHide() {

  }

  onBlurTitle (e:React.SyntheticEvent<HTMLInputElement>) {
    let {flow} = this.props
    flow.label = e.currentTarget.value
    this.props.updateFlow(flow)
  }

  onClickAddFlowParam () {
    let {flow} = this.props
    const name = this.setNewParamName('new_param', 1)
    const uuid = StringUtil.generateUUID();
    flow.params.push({label:name, name: name, type: 'string',uuid: uuid})
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

  onDescriptionChange (e:React.SyntheticEvent<HTMLTextAreaElement>) {
    let {flow} = this.props
    flow.description = e.currentTarget.value
    this.props.updateFlow(flow)
  }

  onParamChange (e:React.SyntheticEvent<HTMLInputElement>, index:number) {
    let {flow} = this.props
    flow.params[index].name = e.currentTarget.value;
    flow.params[index].label = e.currentTarget.value;
    
    this.props.updateFlow(flow)
  }

  onClickDeleteParam (e:React.SyntheticEvent<HTMLInputElement>, index:number) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        this.onDeleteParam(index)
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

  onDeleteParam (index) {
    let {flow} = this.props
    const newParams = flow.params.filter((param, paramIndex) => {
      return (paramIndex !== index)
    })
    
    flow.params = newParams
    this.props.updateFlow(flow)
  }

  render () {
    const {flow, mast, addStep, selectSteps, selected_step_ids, addHistory, addFlowVariableHidden, commandSelectorHidden, baseInspectorDisabled} = this.props
    if (!flow) return null
    const {params} = flow

    let inputParams, inputParamsContainer, addFlowParams
    this.paramRefs = []
    inputParams = params.map((param, index) => {
      return <div key={param.uuid} className={style.flow_param}>
        <div className={style.left}>
          <input type={'text'} readOnly={baseInspectorDisabled} className={'form-control'} value={param.name}
                 onChange={(e) => {this.onParamChange(e, index)}}/>
        </div>
        <div className={style.right}>
          <Button danger={true} disabled={baseInspectorDisabled} onClick={() => this.onClickDeleteParam(param, index)}>削除</Button>
        </div>
      </div>
    })

    if (inputParams && inputParams.length) {
      inputParamsContainer = <div className={"mt-8px"}>
        <label>フロー変数</label>
        {inputParams}
      </div>
    } else if(baseInspectorDisabled) {
      inputParamsContainer = <div className={"mt-8px"}>
        <label>フロー変数</label>
        <div className={"text-center"}>
          <div className={style.label}>
            フロー変数が設定されていません
          </div>
        </div>
      </div>
    }else{
      inputParamsContainer = <div className={"mt-8px"}>
        <label>フロー変数</label>
      </div>
    }
    if(!addFlowVariableHidden){
      addFlowParams = <AddButton onClick={() => this.onClickAddFlowParam()}>フロー変数を追加する</AddButton>
    }

    return <BaseInspector key={flow.uuid} header={''} label={flow.label}
                          onBlurTitle={(e) => this.onBlurTitle(e)} onHide={() => this.onHide()}
                          disabled={baseInspectorDisabled}>
      <textarea className={'form-control mb-8px'} placeholder={'フローの説明'} ref={'description'}
                defaultValue={this.props.flow.description} rows={8}
                onChange={(e) => this.onDescriptionChange(e)} disabled={(baseInspectorDisabled)}></textarea>
      {inputParamsContainer}
      {addFlowParams}
      {
        (!commandSelectorHidden) ?
          <Fragment>
            <div className={style.full_hr} />
            <CommandSelector
              mast={mast}
              numberOfInput={0}
              selected_step_ids={selected_step_ids}
              addStep={addStep}
              selectSteps={selectSteps}
              addHistory={addHistory}
            />
          </Fragment>
          : null
      }
    </BaseInspector>
  }
}

export default FlowSettingsInspector
