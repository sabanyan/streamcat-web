// @flow
import * as React from 'react'
import Inspector from '../Inspector'
import type {FlowEditorProps} from "../../index";
import style from '../style.scss'
import Button from '../../../shared/Button'
import CommandStepModel from '../../../../model/CommandStepModel'
import InOutConnector from './InOutConnector'

type CommandInspectorProps = {
    ...FlowEditorProps,
    children?:React.Node
}

class CommandInspector extends React.Component<CommandInspectorProps> {

    onClickSave(e:Event) {
        let {selected_step_ids,nodes} = this.props
        let selected_step = nodes[selected_step_ids[0]]

        //パラメーターを更新
        Object.keys(this.refs).map((key)=>{
              selected_step.parameters[key] = this.refs[key].value
        })

        this.props.updateStep(selected_step)
        this.props.selectSteps()
    }

    onClickDelete(e:Event) {
        if(window.confirm("このコマンドを削除しますか？")){
          let {selected_step_ids,nodes} = this.props
          let selected_step = nodes[selected_step_ids[0]]
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
        let {selected_step_ids,nodes} = this.props

        const selected_step:CommandStepModel = nodes[selected_step_ids[0]]

        let inputForm

        inputForm = Object.keys(selected_step.args).map((key:string,index:number)=>{
            const parameter = selected_step.args[key]
            const command_name:string = selected_step.name
            const command = self.getCommand(command_name)
            const argument:{caption?:string} = self.getCommandArgument(key,command)

          console.log(selected_step)
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


        return <Inspector key={selected_step.id} header={selected_step.text} title={"プロパティ"} {...this.props}>
          <InOutConnector {...this.props}/>
          <div className="kskp-property-body">
                    <div className="kskp-form">
                        {/*<label>f</label>*/}
                        {/*<input type="text" className="form-control mb-12px" defaultValue={f} ref="f"/>*/}
                        {inputForm}
                      <br/>
                        <Button onClick={(e) => this.onClickSave(e)}>適用</Button>
                        <Button onClick={(e) => this.onClickDelete(e)} danger={true}>削除</Button>
                    </div>
                </div>
        </Inspector>
    }

}

export default CommandInspector