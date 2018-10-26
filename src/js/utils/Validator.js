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
import ValidateJS from 'validate.js'

class Validator {
  ajv:Ajv
  constructor (){
    this.ajv = new Ajv()
    //日本語対応のバリデーターに変更する
    ValidateJS.options = {fullMessages: false};

    ValidateJS.validators.length.options = {
      notValid: "入力桁数が正しくありません",
      wrongLength: "%{count}文字の入力が必要です",
      tooShort: "%{count}桁の入力が必須です",
      tooLong: "%{count}桁の入力までです"
    }
    ValidateJS.validators.presence.options = {
      message: "入力が必須の項目です"
    }
    ValidateJS.validators.numericality.options = {
      notValid: "数値を入力してください"
    }
    ValidateJS.validators.numericality.options = {
      notValid: "数値を入力してください",
      notOdd: "奇数を入力してください",
      notEven: "偶数を入力してください",
    }
    ValidateJS.validators.format.options = {
      message: "指定のフォーマットが正しくありません",
    }
    ValidateJS.validators.datetime.options = {
      notValid: "日付を入力してください",
    }
  }

  schemaValidate(schema,state) {
    const valid = this.ajv.validate(schema, state)
    if (!valid) {
      Log.error(this.ajv.errorsText() + " by " + schema.$id,state)
      return false
    }
    return true
  }

  isFlowModelSchema(state){
    return this.schemaValidate(FlowModelSchema,state)
  }

  isGraphModelSchema(state){
    return this.schemaValidate(GraphModelSchema,state)
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
      const result = this.schemaValidate(schema,node)
      if(!result)success = false
    })
    return success
  }

  isFlowModelSchema(state){
    return this.schemaValidate(FlowModelSchema,state)
  }

  nodesValidate(nodes){
    return nodes.forEach((node) => {
      node.validate()
    })
  }
}

export default new Validator()