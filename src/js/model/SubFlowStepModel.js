import type { CommandStepModelProps } from './CommandStepModel'
import CommandStepModel from './CommandStepModel'

export type SubFlowStepModelProps = {
  ...CommandStepModelProps,
  uuid: string
}

export default class SubFlowStepModel extends CommandStepModel{
  uuid: string
  constructor (props: SubFlowStepModelProps) {
    super(props)
    this.uuid = props.uuid
  }

}