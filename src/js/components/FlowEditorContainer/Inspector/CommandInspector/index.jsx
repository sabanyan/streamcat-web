// @flow
import * as React from 'react'
import Inspector from '../Inspector'
import type {FlowEditorProps} from "../../index";
import style from '../style.scss'
import Button from '../../../shared/Button'
import CommandStepModel from '../../../../model/Step/CommandStepModel'
import InOutConnector from './InOutConnector'
import Constants from '../../../../constants'
import Graph from '../../../../utils/Graph'
import type { CommandParamType, CommandPortType, StepModelType } from '../../../../types'
import CommandModel from '../../../../model/Command/CommandModel'

type CommandInspectorProps = {
    ...FlowEditorProps,
    children?:React.Node
}

class CommandInspector extends React.Component<CommandInspectorProps> {

    getSelectedStep(){
      let {selected_step_ids, nodes} = this.props
      return Graph.getNode(nodes,selected_step_ids[0])
    }

    onClickSave(e:Event) {
        let selected_step = this.getSelectedStep()

        //パラメーターを更新
        Object.keys(this.refs).map((key)=>{
              selected_step.args[key] = this.refs[key].value
        })

        this.props.updateStep(selected_step)
        this.props.selectSteps()
    }

    onClickDelete(e:Event) {
        if(window.confirm("このコマンドを削除しますか？")){
          let selected_step = this.getSelectedStep()
          this.props.deleteSteps([selected_step.id])
          this.props.selectSteps()
        }
    }

    getCommand(commandId:string):CommandModel{
        let command = null;
        this.props.mast.commands.map((_command)=>{
            if(commandId === _command.id){
              command = _command
            }
        })
        return command
    }

    getCommandParam(paramName:string,command:CommandModel):CommandParamType{
        let param = {};
        if(command && command.getParams()){
          command.getParams().map((_param)=>{
                if(_param.name == paramName){
                  param = _param
                }
            })
        }
        return param
    }

    onChangeInEdge(e){

    }

    onChangeOutEdge(e){

    }

    render() {
        const self = this
        let selected_step:StepModelType = this.getSelectedStep()
        let inputForm
        inputForm = Object.keys(selected_step.args).map((key:string,index:number)=>{
            const parameter = selected_step.args[key]
            const command:CommandModel = self.getCommand(selected_step.commandId)
            const param:CommandParamType = self.getCommandParam(key,command)
            return <div key={index}>
                <label>{param.label}</label>
                <label className="float-right">{param.name}</label>
                <input type="text" className="form-control" defaultValue={parameter} placeholder={param.name} ref={param.name}/>
            </div>
        })

      const subFlowLink = (selected_step.type === Constants.step.type.subflow)?<a href={"http://localhost:5000/flows/"+selected_step.uuid} target={"_blank"}>フローを開く</a>:null

        return <Inspector key={selected_step.id} header={selected_step.text} title={"プロパティ"} {...this.props}>
          {subFlowLink}
          <InOutConnector {...this.props}/>
          <div className={style.hr}/>
          <div className={style.property_title}>
            パラメータ
          </div>
          <div>
              <div className="kskp-form">
                  {inputForm}
              </div>
          </div>
          <br/>
          <Button onClick={(e) => this.onClickSave(e)}>適用</Button>
          <Button onClick={(e) => this.onClickDelete(e)} danger={true}>削除</Button>

        </Inspector>
    }

}

export default CommandInspector