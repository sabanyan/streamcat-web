//@flow
import type { CommandStepModelProps } from './CommandStepModel'
import CommandStepModel from './CommandStepModel'
import type { CommandParamType } from '../../types'
import SubflowCommandModel from '../Command/SubflowCommandModel'

export type SubFlowStepModelProps = {
  ...CommandStepModelProps,
  uuid: string
}

export default class SubFlowStepModel extends CommandStepModel {
  uuid: string = null

  constructor (props: SubFlowStepModelProps) {
    super(props)
    this.initialize(props, 'uuid')
  }

  getCommand (): SubflowCommandModel {
    let subflow = null
    window.subflows.forEach((_subflow) => {
      if (this.uuid === _subflow.uuid) {
        subflow = _subflow
      }
    })
    return subflow
  }

  getLabel () {
    if (this.label == this.id) {
      return this.getCommand().label
    }

    return this.label
  }

  addableInPort () {
    return null
  }

  validate () {
    //必須バリデーション
    Object.keys(this.args).map(key => {
      let command: SubflowCommandModel = this.getCommand()
      const value = this.args[key]
      //const param: CommandParamType = command.getParam(key)
      // if(!param.optional){
      //   if(value === "" || value === null){
      //     this.invalid[key] = "入力が必須の項目です"
      //   }
      // }
    })
  }
}
