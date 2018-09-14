//@flow
import CommandStepModel from './CommandStepModel'
import type { CommandStepModelProps } from './CommandStepModel'
import type { CommandModelType } from '../../types'
import SubflowCommandModel from '../Command/SubflowCommandModel'

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

  getCommand(commands:[SubflowCommandModel]):SubflowCommandModel{
    let command = null;
    commands.forEach((_command)=>{
      if(this.uuid === _command.uuid){
        command = _command
      }
    })
    console.log(command)
    return command
  }
}
