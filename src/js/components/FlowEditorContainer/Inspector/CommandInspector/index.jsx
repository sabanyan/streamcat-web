// @flow
import * as React from 'react'
import Inspector from '../Inspector'
import type {FlowEditorProps} from "../../index";
import style from '../style.scss'
import Button from '../../../shared/Button'
import CommandStepModel from '../../../../model/CommandStepModel'
import InOutConnector from './InOutConnector'
import Constants from '../../../../constants'

type CommandInspectorProps = {
    ...FlowEditorProps,
    children?:React.Node
}

class CommandInspector extends React.Component<CommandInspectorProps> {

    getSelectedStep(){
      let {selected_step_ids, nodes} = this.props
      return nodes[selected_step_ids[0]]
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

  getCommand(command_name:string){
        let command = null;
        this.props.mast.commands.map((_command)=>{
            if(command_name === _command.name){
              command = _command
            }
        })
        return command
    }

    getCommandArgument(argument_name:string,command:?{arguments:any[]}){
        let argument = {};
        if(command && command.arguments){
          command.arguments.map((arg)=>{
                if(arg.name == argument_name){
                  argument = arg
                }
            })
        }
        return argument
    }

    onChangeInEdge(e){

    }

    onChangeOutEdge(e){

    }

    render() {

        const self = this
        let selected_step = this.getSelectedStep()

        let inputForm

        inputForm = Object.keys(selected_step.args).map((key:string,index:number)=>{
            const parameter = selected_step.args[key]
            const command_name:string = selected_step.name
            const command = self.getCommand(command_name)
            const argument:{caption?:string} = self.getCommandArgument(key,command)

            const argument_name = key
            return <div key={index}>
                <label>{argument.caption}</label>
                <input type="text" className="form-control" defaultValue={parameter} placeholder={argument_name} ref={argument_name}/>
                {/*<div key={self.props.name + "_" + argument.name} className="mb-8px">*/}
                    {/*<label>*/}
                      {/*{argument.caption}*/}
                    {/*</label>*/}
                    {/*<input type="text" className="form-control" placeholder={argument.name} ref={(element)=>{self.inputRefs.push({argument:argument,element:element})}} defaultValue={""}></input>*/}
                {/*</div>*/}
            </div>
        })

      console.log(selected_step.uuid)
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