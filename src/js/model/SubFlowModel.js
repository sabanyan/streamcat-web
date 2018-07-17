import type { StepModelProps } from './StepModel'
import StepModel from './StepModel'

export type SubFlowModelProps = {
  ...StepModelProps
}

export default class SubFlowModel extends StepModel{
  constructor (props: SubFlowModelProps) {
    super(props)
  }
}