import type { CommandStepModelProps } from './CommandStepModel'
import CommandStepModel from './CommandStepModel'

export type SubFlowStepModelProps = {
  ...CommandStepModelProps
}

export default class SubFlowStepModel extends CommandStepModel{
  constructor (props: SubFlowStepModelProps) {
    super(props)
  }
}