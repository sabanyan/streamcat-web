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
      console.log(selected_step)
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

    onClickSave(e:Event) {
        let selected_step = this.getSelectedStep()

      console.log("SAVE")
        console.log(this.inputRefs)

        selected_step.args = ParamUtil.getArgsFromInputRefs(this.inputRefs)

        this.props.updateStep(selected_step)
        this.props.selectSteps()
    }

    onClickDelete(e:Event) {
      ModalUtil.registerModal({
        id: Constants.modal.CONFIRM, onClickDone: () => {
          let selected_step = this.getSelectedStep()
          this.props.deleteSteps([selected_step.id])
          this.props.selectSteps()
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

    render() {
        const {commands} = this.props.mast
        let selected_step:StepModelType = this.getSelectedStep()
        let inputForm = [],subFlowLink,content,title
        const onBuild = (param,element) => this.onBuild(param,element)

        if(selected_step.type === Constants.step.type.command){
          const command:CommandModel = selected_step.getCommand(commands)
          title = (command)?command.label:selected_step.commandId
          this.inputRefs = []
          inputForm = Object.keys(selected_step.args).map((key:string,index:number)=>{
            const parameter = selected_step.args[key]
            const command:CommandModel = selected_step.getCommand(commands)
            const param:CommandParamType = FlowUtil.getCommandParam(key,command)
            let paramElement = ParamUtil.getParamElement(param,onBuild,parameter,param.name)
            return <div key={index}>
              {paramElement}
            </div>
          })
        }else if(selected_step.type === Constants.step.type.subflow){
          title = selected_step.label
          inputForm = Object.keys(selected_step.args).map((key:string,index:number)=>{
            const parameter = selected_step.args[key]
            const hasSubFlowParam = (FlowUtil.getSubFlowParam(this.selectedSubFlow,key))
            const param:SubFlowParamType = (hasSubFlowParam)?FlowUtil.getSubFlowParam(this.selectedSubFlow,key):key
            let paramElement = ParamUtil.getParamElement(param,onBuild,parameter,param.name)
            return <div key={index}>
              <label className="float-right text-danger">{(hasSubFlowParam)?"":"不明なパラメーター"}</label>
              {paramElement}
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
            <Button onClick={(e) => this.onClickSave(e)}>適用</Button>
            <Button onClick={(e) => this.onClickDelete(e)} danger={true}>削除</Button>
          </div>
        }


        return <BaseInspector key={selected_step.id} header={selected_step.text} title={title} {...this.props}>
          {content}
        </BaseInspector>
    }

}

export default CommandInspector