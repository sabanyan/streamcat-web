//@flow
import * as React from 'react'
import BaseInspector from '../BaseInspector/index'
import type {FlowEditorProps} from "../../../FlowEditorContainer/index";
import style from '../style.scss'
import Button from '../../Button/index'
import CommandStepModel from '../../../../model/Step/CommandStepModel'
import InOutConnector from './InOutConnector/index'
import Constants from '../../../../constants/index'
import Graph from '../../../../utils/Graph'
import type { CommandParamType, CommandPortType, StepModelType, SubFlowParamType } from '../../../../types/index'
import CommandModel from '../../../../model/Command/CommandModel'
import HttpUtil from '../../../../utils/HttpUtil'
import FlowModel from '../../../../model/Flow/FlowModel'
import Loader from '../../Loader/index'
import FlowUtil from '../../../../utils/FlowUtil'
import ModalUtil from '../../../../utils/ModalUtil'
import ParamString from '../../Param/ParamString'
import ParamBoolean from '../../Param/ParamBoolean'
import ParamUtil from '../../../../utils/ParamUtil'
import StateUtil from '../../../../utils/State'
import SubflowCommandModel from '../../../../model/Command/SubflowCommandModel'
import ValidationForm from '../../ValidationForm'
import classnames from 'classnames'

type CommandInspectorProps = {
    ...FlowEditorProps,
    children?:React.Node
}

class CommandInspector extends React.Component<CommandInspectorProps> {
    inputRefs: any[]

    selectedSubFlow:FlowModel
    loaded:boolean = false

    constructor(props: CommandInspectorProps) {
      super(props)
      this.inputRefs = []
    }

    componentWillMount () {
      //データフレームの詳細を取得する
      const {updateStep} = this.props
      const selected_step:StepModelType = this.getSelectedStep()
      this.selectedSubFlow = null
      if (selected_step instanceof CommandStepModel) {
        if(selected_step.type === Constants.step.type.subflow){
          //サブフローの場合のみ詳細を取得
          HttpUtil.get("flows/"+selected_step.uuid+"?navigation=off").then((response)=>{
            this.selectedSubFlow = new FlowModel(response.data.data)
            this.loaded = true
            this.forceUpdate()
          })
        }else{
          //サブフロー以外の場合は読み込み完了
          this.loaded = true
        }
      }
    }

    getSelectedStep(){
      let {selected_step_ids, nodes} = this.props
      return Graph.getNode(nodes,selected_step_ids[0])
    }

    onHide(){
      this.updateArgs()
      this.saveNodes()
    }

    updateArgs() {
      let selected_step = this.getSelectedStep()
      selected_step.args = ParamUtil.getArgsFromInputRefs(this.inputRefs)
      this.props.updateStep(selected_step)
    }

    deleteStep(){
      let selected_step = this.getSelectedStep()
      this.props.deleteSteps([selected_step.id])
      this.props.selectSteps()
    }

    saveNodes(){
      let {nodes} = this.props
      return FlowUtil.saveNodes(inject_flow_uuid,nodes).then(()=>{
        this.props.addHistory()
      })
    }

    onClickDelete(e:Event) {
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

    onChangeInEdge(e,data){
      console.log(e)
      console.log(data)
    }

    onChangeOutEdge(e,data){
      console.log(e)
      console.log(data)
    }

    onBuild(param,element){
      if (element)this.inputRefs.push({param: param, element: element})
    }

    getInvalidMessageElement(step:StepModel,key:string){
      const invalidMessage = step.invalid[key]
      if(invalidMessage){
        if(Array.isArray(invalidMessage)){
          const arrayMessage = invalidMessage.map(message=>{
            return <div className={style.invalid_message}>
              {message}
            </div>
          })
          return <div>{arrayMessage}</div>
        }
        return <div className={style.invalid_message}>
          {step.invalid[key]}
        </div>
      }
      return null
    }

    render() {
        const {commands,subflows} = this.props.mast
        let selected_step:StepModelType = this.getSelectedStep()
        let inputForm = []
        let subFlowLink,content,label,subLabel
        const onBuild = (param,element) => this.onBuild(param,element)


        if(selected_step.type === Constants.step.type.command){
          const command:CommandModel = selected_step.getCommand()
          label = selected_step.label
          subLabel = command.label
          this.inputRefs = []
          inputForm = command.params.map((param,index) =>{
            const value = selected_step.args[param.name]//入力値
            let isPresence = false
            if(command.rules &&
              command.rules[param.name] &&
              command.rules[param.name]['presence']){
              isPresence = true
            }
            let paramElement = ParamUtil.getParamElement(param,onBuild,value,param.name)//パラメータのエレメント
            const invalidMessageEelement = this.getInvalidMessageElement(selected_step,param.name)//入力エラー
            return <div key={index} className={classnames('mb-8px',{[style.presence]:isPresence,[style.invalid]:(invalidMessageEelement)})}>
              {paramElement}
              {invalidMessageEelement}
            </div>
          })
        }else if(selected_step.type === Constants.step.type.subflow){
          const subflowCommand:SubflowCommandModel = selected_step.getCommand()
          label = selected_step.label
          subLabel = subflowCommand.label
          this.inputRefs = []
          inputForm = subflowCommand.params.map((param,index)=>{
            const value = selected_step.args[param.name]
            const hasSubFlowParam = (FlowUtil.getSubFlowParam(this.selectedSubFlow,param.name))

            //サブフローは必須設定がないため optional trueを有効にしておく
            param.optional = true

            let paramElement = ParamUtil.getParamElement(param,onBuild,value,param.name)
            const invalidMessageEelement = this.getInvalidMessageElement(selected_step,param.name)
            return <div key={index}>
              <label className="float-right text-danger">{(hasSubFlowParam)?"":"不明なパラメーター"}</label>
              {paramElement}
              {invalidMessageEelement}
            </div>
          })
          subFlowLink = <a href={"/flows/"+selected_step.uuid} target={"_blank"}>フローを開く</a>
        }

        let form

        if(inputForm.length){
          form = <div>
                <div className={style.full_hr} />
                <div>
                  <div className="kskp-form">
                      {inputForm}
                </div>
            </div>
          </div>
        }

        if(!this.loaded){
          content = <Loader center={true} absolute={false} fixed={false} visible={true}/>
        }else {
          content = <div>
            {subFlowLink}
            <div className={style.full_hr} />
            <InOutConnector {...this.props} onChangeInEdge={(e,data)=>this.onChangeInEdge(e,data)} onChangeOutEdge={(e,data)=>this.onChangeOutEdge(e,data)} selectedStep={selected_step} selectedSubFlow={this.selectedSubFlow}/>
            {form}
            <div className={style.full_hr} />
            {/*<Button onClick={(e) => this.onClickSave(e)}>適用</Button>*/}
            <Button onClick={(e) => this.onClickDelete(e)} danger={true}>削除</Button>
          </div>
        }

        return <BaseInspector key={selected_step.id} header={""} label={label} subLabel = {subLabel} name={selected_step.id} {...this.props} onBlurTitle={(e)=>this.onBlurTitle(e)} onHide={()=>this.onHide()} >
          {content}
        </BaseInspector>
    }

    onBlurTitle(e:SyntheticInputEvent<EventTarget>){
      const selectedStep = this.getSelectedStep()
      let newSelectedStep = StateUtil.deepCopy(selectedStep)
      newSelectedStep.label = e.target.value
      this.props.updateStep(newSelectedStep)
    }
}

export default CommandInspector