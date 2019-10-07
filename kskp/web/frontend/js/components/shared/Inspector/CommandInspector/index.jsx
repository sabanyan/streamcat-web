//@flow
import * as React from 'react'
import { BaseInspector, InOutConnector, ParamsForm } from 'Shared/Inspector'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import style from '../style.scss'
import { Button } from 'Shared/Input'
import { CommandStepModel, SubflowCommandModel } from 'Model/index'
import Constants from 'Constants/index'
import { APIUtil, GraphUtil, ModalUtil, ParamUtil, StateUtil } from 'Utils/index'
import type { CommandParamType, MastType, StepModelType } from 'Types/index'
import CommandModel from 'Model/Command/CommandModel'
import FlowModel from 'Model/Flow/FlowModel'
import { Loader } from 'Shared/Base'

type CommandInspectorProps = {
  selected_step_ids: [];
  mast: MastType;
  nodes: [];
  updateStep: Function;
  addHistory: Function;
  selectSteps: Function;
  deleteSteps: Function;
  updateStep: Function;
  children?: React.Node;
  sortStepSrcEnd: Function;
}

class CommandInspector extends React.Component<CommandInspectorProps> {
  inputRefs: any[]

  selectedSubFlow: FlowModel
  loaded: boolean = false

  constructor (props: CommandInspectorProps) {
    super(props)
    this.inputRefs = []
  }

  componentWillMount () {
    //データフレームの詳細を取得する
    const {updateStep} = this.props
    const selected_step: StepModelType = this.getSelectedStep()
    this.selectedSubFlow = null
    if (selected_step instanceof CommandStepModel) {
      if (selected_step.type === Constants.step.type.subflow) {
        //サブフローの場合のみ詳細を取得
        APIUtil.get('flows/' + selected_step.uuid + '?navigation=off').then((response) => {
          this.selectedSubFlow = new FlowModel(response.data.data)
          this.loaded = true
          this.forceUpdate()
        })
      } else {
        //サブフロー以外の場合は読み込み完了
        this.loaded = true
      }
    }
  }

  getSelectedStep () {
    let {selected_step_ids, nodes} = this.props
    return GraphUtil.getNode(nodes, selected_step_ids[0])
  }

  onHide () {
    //this.updateArgs()
    //this.saveNodes()
  }

  updateArgs () {
    let selected_step = this.getSelectedStep()
    selected_step.args = ParamUtil.getArgsFromInputRefs(this.inputRefs)
    this.props.updateStep(selected_step)
    this.props.addHistory()
  }

  deleteStep () {
    let selected_step = this.getSelectedStep()
    this.props.deleteSteps([selected_step.id])
    this.props.selectSteps()
  }

//    saveNodes(){
//      let {nodes,history} = this.props
//
//      const isSame = FlowUtil.isSameCurrentNodesToBeforeHistoryNodes(history,nodes)
//      if(isSame)return
//
//      return FlowUtil.saveNodes(inject_flow_uuid,nodes).then(()=>{
//        this.props.addHistory()
//      })
//    }

  onClickDelete (e: Event) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        this.deleteStep()
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたステップを削除しますか？
      </div>,
    })
  }

  onChangeInEdge (e, data) {
    console.log(e)
    console.log(data)
  }

  onChangeOutEdge (e, data) {
    console.log(e)
    console.log(data)
  }

  onBuild (param, element) {
    if (element) this.inputRefs.push({param: param, element: element})
  }

  onArgChange (e: Event) {
    const argName = e.currentTarget.name

    this.update((step) => {
      if (step.args) {
        let v = ParamUtil.getArgValue(e.currentTarget)
        step.args[argName] = v
      }
      return step
    })
  }

  update (getNewStep: Function) {
    let selectedStep = this.getSelectedStep()
    const newStep = getNewStep(selectedStep)
    this.props.updateStep(newStep)
  }

  render () {
    const {selectedStep, updateStep, sortStepSrcEnd} = this.props;
    const {commands, subflows} = this.props.mast
    let selected_step: StepModelType = this.getSelectedStep()
    let inputForm = []
    let subFlowLink, content, label, subLabel
    let events = {onChange: (e) => this.onArgChange(e)}
    if (selected_step.type === Constants.step.type.command) {
      //指定されたステップの元コマンドを取得
      const command: CommandModel = selected_step.getCommand()
      //選択されたステップのラベルを取得
      label = selected_step.getLabel()
      //コマンドのラベルを取得
      subLabel = command.label
      this.inputRefs = []

      const params: [CommandParamType] = command.params
      const args: {} = selected_step.args
      const invalids: {} = selected_step.invalid

      inputForm = <ParamsForm params={params} args={args} invalids={invalids} rules={command.rules} invalids={invalids}
                              events={events} />

    } else if (selected_step.type === Constants.step.type.subflow) {
      const subflowCommand: SubflowCommandModel = selected_step.getCommand()
      label = selected_step.getLabel()
      subLabel = subflowCommand.label
      this.inputRefs = []

      const params: [CommandParamType] = subflowCommand.params
      const args: {} = selected_step.args
      const invalids: {} = selected_step.invalid

      inputForm = <ParamsForm params={params} args={args} invalids={invalids} invalids={invalids}
                              events={events} />

      subFlowLink = <a href={'/flows/' + selected_step.uuid} target={'_blank'}>フローを開く</a>
    }

    let form

    if (inputForm) {
      form = <div>
        <div className={style.full_hr} />
        <div>
          <div className="kskp-form">
            {inputForm}
          </div>
        </div>
      </div>
    }

    if (!this.loaded) {
      content = <Loader center={true} absolute={false} fixed={false} visible={true} />
    } else {
      content = <div>
        {subFlowLink}
        <div className={style.full_hr} />
        <InOutConnector
            selectedStep={selectedStep}
            updateStep={updateStep}
            nodes={nodes}
            sortStepSrcEnd={sortStepSrcEnd}
            onChangeInEdge={(e, data) => this.onChangeInEdge(e, data)}
            onChangeOutEdge={(e, data) => this.onChangeOutEdge(e, data)} selectedStep={selected_step}
            selectedSubFlow={this.selectedSubFlow}
        />
        {form}
        <div className={style.full_hr} />
        {/*<Button onClick={(e) => this.onClickSave(e)}>適用</Button>*/}
        <Button onClick={(e) => this.onClickDelete(e)} danger={true}>削除</Button>
      </div>
    }

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector key={selected_step.id} header={''} label={label} subLabel={subLabel}
                          name={selected_step.id} onHide={() => this.onHide()}
                          onBlurTitle={(e) => this.onBlurTitle(e)}>
      {content}
    </BaseInspector>
  }

  onBlurTitle (e: SyntheticInputEvent<EventTarget>) {
    const selectedStep = this.getSelectedStep()
    let newSelectedStep = StateUtil.deepCopy(selectedStep)
    newSelectedStep.label = e.target.value
    this.props.updateStep(newSelectedStep)
  }
}

export default CommandInspector