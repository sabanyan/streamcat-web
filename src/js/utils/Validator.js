//@flow
import Ajv from 'ajv/lib/ajv'
import FlowModelSchema from '../schema/flow/FlowModelSchema.json'
import GraphModelSchema from '../schema/graph/GraphModelSchema.json'
import CommandStepModelSchema from '../schema/steps/CommandStepModelSchema.json'
import DataFrameStepModelSchema from '../schema/steps/DataFrameStepModelSchema.json'
import SubFlowCommandModeSchema from '../schema/steps/SubFlowStepModelSchema.json'

import Log from './Log'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import CommandStepModel from '../model/Step/CommandStepModel'

class Validator {
  ajv:Ajv
  constructor (){
    this.ajv = new Ajv()
  }

  validate(schema,state) {
    const valid = this.ajv.validate(schema, state)
    if (!valid) {
      Log.error(this.ajv.errorsText() + " by " + schema.$id,state)
      return false
    }
    return true
  }

  isFlowModelSchema(state){
    return this.validate(FlowModelSchema,state)
  }

  isGraphModelSchema(state){
    return this.validate(GraphModelSchema,state)
  }

  isNodesSchema({nodes}){
    let success = true
    nodes.forEach((node)=>{
      let schema
      if(node instanceof DataFrameStepModel){
        schema = DataFrameStepModelSchema
      }else if(node instanceof SubFlowStepModel){
        schema = SubFlowCommandModeSchema
      }else if(node instanceof CommandStepModel){
        schema = CommandStepModelSchema
      }
      const result = this.validate(schema,node)
      if(!result)success = false
    })
    return success
  }

  isFlowModelSchema(state){
    return this.validate(FlowModelSchema,state)
  }



}

export default new Validator()