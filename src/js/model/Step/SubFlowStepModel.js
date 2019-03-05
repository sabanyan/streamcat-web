//@flow
import CommandStepModel from './CommandStepModel'
import type { CommandStepModelProps } from './CommandStepModel'
import type { CommandModelType, CommandParamType } from '../../types'
import SubflowCommandModel from '../Command/SubflowCommandModel'
import CommandModel from '../Command/CommandModel'

export type SubFlowStepModelProps = {
  ...CommandStepModelProps,
  uuid: string
}

export default class SubFlowStepModel extends CommandStepModel{
  uuid: string = null
  constructor (props: SubFlowStepModelProps) {
    super(props)
    this.initialize(props,"uuid")
  }

  getCommand():SubflowCommandModel{
    let subflow = null;
    window.subflows.forEach((_subflow)=>{
      if(this.uuid === _subflow.uuid){
        subflow = _subflow
      }
    })
    return subflow
  }

  validate(){
    //必須バリデーション
    Object.keys(this.args).map(key => {
      let command:SubflowCommandModel = this.getCommand()
      const value = this.args[key]
      const param:CommandParamType = command.getParam(key)
      // if(!param.optional){
      //   if(value === "" || value === null){
      //     this.invalid[key] = "入力が必須の項目です"
      //   }
      // }
    })
  }
}
