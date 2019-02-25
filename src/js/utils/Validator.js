//@flow
import Ajv from 'ajv/lib/ajv'
import FlowModelSchema from '../schema/flow/FlowModelSchema.json'
import GraphModelSchema from '../schema/graph/GraphModelSchema.json'
import CommandStepModelSchema from '../schema/steps/CommandStepModelSchema.json'
import DataFrameStepModelSchema from '../schema/steps/DataFrameStepModelSchema.json'
import SubFlowCommandModelSchema from '../schema/steps/SubFlowStepModelSchema.json'
import NoteStepModelSchema from '../schema/steps/NoteStepModelSchema.json'

import Log from './Log'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import CommandStepModel from '../model/Step/CommandStepModel'
import ValidateJS from 'validate.js'
import CommandUtil from './CommandUtil'
import NoteStepModel from '../model/Step/NoteStepModel.js';

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

    //---------------------------------------------
    //
    // presencesIfTargetIsInput
    //
    // ターゲットのパラメーターが 入力されている場合、必須になる
    // この場合、 a にパラメーターが入力されている場合、 b が必須になる
    //
    // 使い方:
    //   "rules": {
    //         "b":{
    //             "presencesIfTargetIsInput": "a"
    //         },
    //
    // 指定されたパラメータが入力されている必要がある
    //
    //---------------------------------------------
    ValidateJS.validators.presencesIfTargetIsInput = function(value, options, key, attributes) {
      //対象のパラメータの入力がある場合は必須項目になる
      const command = CommandUtil.getCommand(attributes["_command_id"])
      let error = false
      let errorTarget = ""
      if(Array.isArray(options)) {
        //配列指定の場合
        options.forEach((option)=>{
          if(attributes[option] && !value){
            //ターゲットの値が入力されている場合
            const paramName = option
            const label = CommandUtil.getCommandParamLabel(command, paramName)
            error = true
            errorTarget = errorTarget + "[" +label + "] "
          }
        })
      }else{
        //単一指定の場合
        if(attributes[options] && !value){
          error = true
          const paramName = options
          const label = CommandUtil.getCommandParamLabel(command, paramName)
          errorTarget = errorTarget + "[" +label + "] "
        }
      }
      return (error)?errorTarget + "が入力されているため、入力が必須の項目です":null;
    };
    //---------------------------------------------
    //
    // presencesIfTargetIsNotInput
    //
    // ターゲットのパラメーターが 入力されていない場合、必須になる
    // この場合、 a にパラメーターが入力されていない場合、 b が必須になる
    //
    // 使い方:
    //   "rules": {
    //         "b":{
    //             "presencesIfTargetIsNotInput": "a"
    //         },
    //
    //---------------------------------------------
    ValidateJS.validators.presencesIfTargetIsNotInput = function(value, options, key, attributes) {
      //対象のパラメータの入力がある場合は必須項目になる
      const command = CommandUtil.getCommand(attributes["_command_id"])
      let error = false
      let errorTarget = ""
      if(Array.isArray(options)) {
        //配列指定の場合
        options.forEach((option)=>{
          if(!attributes[option] && !value){
            //ターゲットの値が入力されている場合
            const paramName = option
            const label = CommandUtil.getCommandParamLabel(command, paramName)
            error = true
            errorTarget = errorTarget + "[" +label + "] "
          }
        })
      }else{
        //単一指定の場合
        if(!attributes[options] && !value){
          error = true
          const paramName = options
          const label = CommandUtil.getCommandParamLabel(command, paramName)
          errorTarget = errorTarget + "[" +label + "] "
        }
      }
      return (error)?errorTarget + "が入力されていないため、入力が必須の項目です":null;
    };
    //---------------------------------------------
    //
    // onlyOneInput
    //
    // 同時に入力されている場合エラーになる
    //
    // この場合、f は skip_fnf と tmpPath が同時に入力されているとエラーになる
    // tmpPath は f が同時に入力されているとエラーになる
    //
    // 使い方:
    // "rules":{
    //  "f":{
    //    "onlyOneInput": ["skip_fnf","tmpPath"]
    //  },
    //  "tmpPath":{
    //    "onlyOneInput": ["f"]
    //  }
    //
    //---------------------------------------------
    ValidateJS.validators.onlyOneInput = function(value, options, key, attributes) {
      //対象のパラメータの入力がある場合は必須項目になる
      const command = CommandUtil.getCommand(attributes["_command_id"])
      let error = false
      let errorTarget = ""
      if(Array.isArray(options)) {
        //配列指定の場合
        options.forEach((option)=>{
          if(attributes[option] && value){
            //ターゲットの値が入力されている場合
            const paramName = option
            const label = CommandUtil.getCommandParamLabel(command, paramName)
            error = true
            errorTarget = errorTarget + "[" +label + "] "
          }
        })
      }else{
        //単一指定の場合
        if(attributes[options] && value){
          error = true
          const paramName = options
          const label = CommandUtil.getCommandParamLabel(command, paramName)
          errorTarget = errorTarget + "[" +label + "] "
        }
      }
      return (error)?errorTarget + "は同時に指定することができません。片方だけ指定してください。":null;
    };
    //---------------------------------------------
    //
    // specificedFormartIfTargetInput
    //
    // 同時に入力されている場合エラーになる
    //
    // この場合、tmpPath は skip_fnf の値が入っている場合、
    // tmpPath は patternで指定した正規表現に基づきチェックが行われる
    //
    // 使い方:
    // "rules":{
    //  "tmpPath":{
    //    "specifiedFormatIfTargetInput": {
    //        "target": "skip_fnf",
    //        "pattern": "[a-z0-9]",
    //        "message": "英数字で入力してください"
    //    }
    //  },
    //
    //---------------------------------------------
    ValidateJS.validators.specifiedFormatIfTargetInput = function(value, options, key, attributes) {
      if(value){
        if(options){
          if(options.target){
            const targetValue = attributes[options.target]
            if(targetValue){
              const regexPattern = RegExp(options.pattern)
              const valid = regexPattern.test(attributes[key])
              if(!valid){
                //正規表現が正しくない
                return options.message
              }
            }
          }
        }
      }
      return null

    }
      //対象のパラメータの入力がある場合は特定のフォーマットが要求される
    //   const command = CommandUtil.getCommand(attributes["_command_id"])
    //   let error = false
    //   let errorTarget = ""
    //   if(Array.isArray(options)) {
    //     //配列指定の場合
    //     options.forEach((option)=>{
    //       if(attributes[option] && value){
    //         //ターゲットの値が入力されている場合
    //         const paramName = option
    //         const label = CommandUtil.getCommandParamLabel(command, paramName)
    //         error = true
    //         errorTarget = errorTarget + "[" +label + "] "
    //       }
    //     })
    //   }else{
    //     //単一指定の場合
    //     if(attributes[options] && value){
    //       error = true
    //       const paramName = options
    //       const label = CommandUtil.getCommandParamLabel(command, paramName)
    //       errorTarget = errorTarget + "[" +label + "] "
    //     }
    //   }
    //   return (error)?errorTarget + "は同時に指定することができません。片方だけ指定してください。":null;
    // };
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
        schema = SubFlowCommandModelSchema
      }else if(node instanceof CommandStepModel){
        schema = CommandStepModelSchema
      }else if(node instanceof NoteStepModel){
        schema = NoteStepModelSchema 
      }
      const result = this.schemaValidate(schema,node)
      if(!result)success = false
    })
    return success
  }

  nodesValidate(nodes){
    return nodes.forEach((node) => {
      node.validate()
    })
  }
}

export default new Validator()