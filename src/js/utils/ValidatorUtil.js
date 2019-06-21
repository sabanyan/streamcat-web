//@flow
import Ajv from 'ajv/lib/ajv'
import FlowModelSchema from 'Schema/flow/FlowModelSchema.json'
import GraphModelSchema from 'Schema/graph/GraphModelSchema.json'
import CommandStepModelSchema from 'Schema/steps/CommandStepModelSchema.json'
import DataFrameStepModelSchema from 'Schema/steps/DataFrameStepModelSchema.json'
import SubFlowCommandModeSchema from 'Schema/steps/SubFlowStepModelSchema.json'
import NoteStepModelSchema from 'Schema/steps/NoteStepModelSchema.json'

import { CommandUtil, LogUtil } from 'Utils/index'
import { CommandStepModel, DataFrameStepModel, SubFlowStepModel } from 'Model/index'
import ValidateJS from 'validate.js'
import NoteStepModel from 'Model/Step/NoteStepModel.js'

class ValidatorUtil {
  ajv: Ajv

  constructor () {
    this.ajv = new Ajv()
    //日本語対応のバリデーターに変更する
    ValidateJS.options = {fullMessages: false}

    ValidateJS.validators.length.options = {
      notValid: '入力桁数が正しくありません',
      wrongLength: '%{count}文字の入力が必要です',
      tooShort: '%{count}桁の入力が必須です',
      tooLong: '%{count}桁の入力までです'
    }
    ValidateJS.validators.presence.options = {
      message: '入力が必須の項目です'
    }
    ValidateJS.validators.numericality.options = {
      notValid: '数値を入力してください'
    }
    ValidateJS.validators.numericality.options = {
      notValid: '数値を入力してください',
      notOdd: '奇数を入力してください',
      notEven: '偶数を入力してください',
    }
    ValidateJS.validators.format.options = {
      message: '指定のフォーマットが正しくありません',
    }
    ValidateJS.validators.datetime.options = {
      notValid: '日付を入力してください',
    }

    const isDefined = ValidateJS.isDefined

    ValidateJS.validators.getRuleMessage = (value, ruleData) => {
      return (new RegExp(ruleData.pattern).test(value)) ? null : ruleData.message
    }

    this.allDefined = function (...params) {
      if (!params) {
        return false
      }

      let index = 0
      let result = true
      while (result && index < params.length) {
        result = ValidateJS.isDefined(params[index])
        index = index + 1
      }

      return result
    }

    //---------------------------------------------
    //
    // presencesIfTargetIsInput
    //
    // ターゲットのパラメーターのいずれかが入力されている場合、必須になる
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

    ValidateJS.validators.presencesIfTargetIsInput = function (value, options, key, attributes) {
      //対象のパラメータの入力がある場合は必須項目になる
      var isValueExist = false
      var errorMessage = []

      if (options && !value) {
        const command = CommandUtil.getCommand(attributes['_command_id'])
        let arrayOptions = Array.isArray(options) ? options : [options]

        arrayOptions.forEach((option) => {
          if (attributes[option]) {
            const label = CommandUtil.getCommandParamLabel(command, option)
            isValueExist = true
            errorMessage.push('[' + label + '] ')
          }
        })
      }

      if (isValueExist) {
        if (errorMessage.length >= 2) {
          return errorMessage + 'のいずれかが入力されているため、入力が必須の項目です'
        } else {
          return errorMessage + 'が入力されているため、入力が必須の項目です'
        }
      } else {
        return null
      }
    }
    //---------------------------------------------
    //
    // presencesIfTargetIsNotInput
    //
    // ターゲットのパラメーターがいずれか入力されていない場合、必須になる
    // この場合、 a にパラメーターが入力されていない場合、 b が必須になる
    // (逆に言えば一つでも対象のパラメータが入力されていればエラーにはならない)
    // 使い方:
    //   "rules": {
    //         "b":{
    //             "presencesIfTargetIsNotInput": "a"
    //         },
    //
    //---------------------------------------------
    ValidateJS.validators.presencesIfTargetIsNotInput = function (value, options, key, attributes) {
      //対象のパラメータの入力がない場合は必須項目になる
      var isValueExist = false
      var errorMessage = []
      if (options && !value) {
        const command = CommandUtil.getCommand(attributes['_command_id'])
        var arrayOptions = Array.isArray(options) ? options : [options]

        arrayOptions.forEach((option) => {
          if (!attributes[option]) {
            //ターゲットの値が入力されている場合
            const label = CommandUtil.getCommandParamLabel(command, option)
            errorMessage.push('[' + label + '] ')
          } else {
            isValueExist = true
          }
        })
        if (isValueExist) {
          return null
        } else if (errorMessage.length >= 2) {
          return errorMessage + 'のいずれかが入力されていないため、入力が必須の項目です'
        } else {
          return errorMessage + 'が入力されていないため、入力が必須の項目です'
        }
      }
      return null
    }
    //---------------------------------------------
    //
    // onlyOneInput
    //
    // 同時に入力されている場合エラーになる
    //
    // この場合、f は nfni と n が同時に入力されているとエラーになる
    // tmpPath は f が同時に入力されているとエラーになる
    //
    // また、suggestTarget（任意）を入力すると、エラーメッセージで対象のパラメータを使用するよう通知する
    // 
    // 使い方:
    // "rules":{
    //  "f":{
    //   "onlyOneInput" : {
    //     "target" : ["nfni", "n"]
    //   }
    // },
    // "n":{
    //   "onlyOneInput" : {
    //     "target" : ["f"]
    //   }
    // },
    // "nfni" : {
    //   "onlyOneInput" : {
    //     "target" : ["f"]
    //   }
    // }
    //---------------------------------------------

    ValidateJS.validators.onlyOneInput = function (value, options, key, attributes) {
      //対象のパラメータの入力がある場合は必須項目になる
      if (options && value) {
        const command = CommandUtil.getCommand(attributes['_command_id'])
        var isError = false
        var errorMessage = []
        let arrayOptions = Array.isArray(options.target) ? options.target : [options.target]

        arrayOptions.forEach((option) => {
          if (attributes[option] && value) {
            //ターゲットの値が入力されている場合
            const label = CommandUtil.getCommandParamLabel(command, option)
            isError = true
            errorMessage.push('[' + label + '] ')
          }
        })

        if (isError) {
          return errorMessage + 'は同時に指定することができません。片方だけ指定してください。'
        }
      }

      return null
    }

    //---------------------------------------------
    //
    // specifiedFormatIfTargetInput
    //
    // 対象のパラメータの入力がある場合は特定のフォーマットが要求される
    //
    // この場合、tmpPath は skip_fnf の値が入っている場合、
    // tmpPath は patternで指定した正規表現に基づきチェックが行われる
    //
    // 使い方:
    // 
    // "rules":{
    //  "tmpPath":{
    //    "specifiedFormatIfTargetInput": {
    //      "target": ["x", "nfn"],
    //      "pattern": "^[1-9]*[0-9]+(,[1-9]*[0-9]+)*$",
    //      "message": "項目の指定は数値で、複数の場合は,(コンマ)で区切って入力してください。"
    //    }
    //  },
    // }
    //---------------------------------------------
    ValidateJS.validators.specifiedFormatIfTargetInput = function (value, options, key, attributes) {
      var isError = false
      if (value && options) {
        let arrayOptions = Array.isArray(options.target) ? options.target : [options.target]

        arrayOptions.forEach((targetName) => {
          if (errorMatchingPattern(targetName)) {
            isError = true
          }
        })
      }

      return (isError) ? options.message : null

      function errorMatchingPattern (targetName) {
        const targetValue = attributes[targetName]
        if (targetValue) {
          const regexPattern = new RegExp(options.pattern)
          const valid = regexPattern.test(attributes[key])
          return !valid
        }
        return false
      }
    }
    //---------------------------------------------
    // 
    // compareNumbersLargerThan
    // 
    // 二つのパラメータに入力されたデータの大小を比較する,数字が大きくなる方に適用する
    // 
    // 関係としては、「fromの値」≦「toの値」
    // この場合、from は to より大きい場合エラーとなる
    // 
    // 使い方:
    // "rules" : {
    //  "to" : {
    //   "compareNumbersLargerThan"{
    //    "target" : "from",
    //    "message" : "fromより数値が大きくなるよう入力してください。"
    //   }
    //  }
    // }
    // 
    //---------------------------------------------
    ValidateJS.validators.compareNumbersLargerThan = function (value, options, key, attributes) {
      // compareNumbersLargerThanではoptions配列は現在はない
      if (value && options && options.target) {
        const targetValue = attributes[options.target]
        // @[f]のような、特殊な意味を持つ単語を除く
        const regexPattern = new RegExp('@\[.+\]')
        if (regexPattern.test(targetValue) || regexPattern.test(value)) return null

        const targetNum = Number(targetValue)
        const valueNum = Number(value)
        if (isFinite(targetNum) && isFinite(valueNum)) {
          return (targetNum > valueNum) ? options.message : null
        }
      }

      return null
    }

    //---------------------------------------------
    // raiseWarningTargetsSelected
    // 
    // ある複数の特定のパラメータ選択時、対象のパラメータの入力がエラーとなる
    // 対象リスト内の項目が一つでも当てはまったらいけない場合は、onlyOneInputを使用
    // 全て当てはまることが必要な場合はraiseWarningTargetsSelectedを使用
    // 
    // 使い方:
    // "rules" : {
    //   "t" : {
    //     "raiseWarningTargetsSelected" : ["exp", "alpha"]
    //   }
    // }
    //---------------------------------------------
    ValidateJS.validators.raiseWarningTargetsSelected = function (value, options, key, attributes) {
      var isError = false
      var errorMessage = []
      if (options && value) {
        var isAllOptionsSelected = true
        const command = CommandUtil.getCommand(attributes['_command_id'])
        let arrayOptions = Array.isArray(options) ? options : [options]
        arrayOptions.forEach((option) => {
          const label = CommandUtil.getCommandParamLabel(command, option)
          errorMessage.push('[' + label + '] ')
          if (!(attributes[option])) {
            isAllOptionsSelected = false
          }
        })
        if (isAllOptionsSelected) {
          isError = true
        }
      }
      return (isError) ? errorMessage + '指定時に同時に指定することができません。' : null
    }

    //---------------------------------------------
    // presencesIfSpecifiedValueInput
    // 
    // あるパラメータの値が特定の値の場合、対象のパラメータが入力もしくは選択されている必要がある
    // 
    // 
    // needOrNotで1なら必須となり、0なら必須でなくなる（基本1やと思うが、mnumberのaの例外として、-Bと、["nfn", "nfno"]指定時にsが必要でなくなることがある）
    // 
    // 使い方(新):
    // "rules" : {
    //   "s" : {
    //     "presencesIfSpecifiedValueInput" : {
    //       "target" : "e",
    //       "value" : ["same", "skip"],
    //       "needOrNot" : "1"
    //     }
    //   }
    // }
    // => e で{same/skip} のどちらかを選択した際に、sの入力が必須となる
    //---------------------------------------------
    ValidateJS.validators.presencesIfSpecifiedValueInput = function (value, options, key, attributes) {
      if (options && options.target) {
        // 対象のパラメータ入力の検知
        const command = CommandUtil.getCommand(attributes['_command_id'])
        const label = CommandUtil.getCommandParamLabel(command, options.target)
        const matchingValue = (options.value).indexOf(attributes[options.target])

        const startMessage = '[' + label + '] ' + 'に' + options.value
        const endMessage = CommandUtil.getCommandParamLabel(command, key) + ']への入力が必須の項目です'

        if ((matchingValue >= 0 && options.needOrNot == 1) && !value) {
          return startMessage + 'のいずれかが入力されているため、[' + endMessage
        } else if ((matchingValue == -1 && options.needOrNot == 0) && !value) {
          return startMessage + 'のいずれも入力されていないため、[' + endMessage
        }
      }
      return null
    }
    //---------------------------------------------
    // lessValueListThanN
    // 
    // あるパラメータのリストの要素数よりN個少ない要素を入力しなければならない
    // 裏を返せば、N=0 なら２つのリストの要素数は同数入力しなければならない
    // 
    // justValueは、difference項目の例外として、
    // ある固定値の項目の入力を許可するというもの
    // 例）Rに５項目入力されていたら、vは４項目入力しなければならないが
    // 例外として、vに1つの入力のみでも構わないというもの
    // ・・・これexceptionとかの方がいいのかな、でもこれはエラーの名前に似てるし嫌やな
    // ここに-1を入れたら無効化、justValueのチェックでは無条件に通過する。
    // 
    // 使い方: (新)
    // "rules": {
    //   "v" : {
    //     "lessValueListThanN" : {
    //       "target" : "R",
    //       "difference" : "1",
    //       "justValue" : "1"
    //     }
    //   }
    // }
    //---------------------------------------------
    ValidateJS.validators.lessValueListThanN = function (value, options, key, attributes) {
      if (options && value) {
        // @[f]のような、特殊な意味を持つ単語を除く
        const targetValue = attributes[options.target]
        const regexPattern = new RegExp('@\[.+\]')
        if (regexPattern.test(value) || regexPattern.test(targetValue)) return null

        const commaInReferrence = (targetValue.match(/,/g) || []).length + 1
        const commaLessThan = (value.match(/,/g) || []).length + 1
        // 入力項目の比較 少ない方の入力数が0の時の誤判定阻止もある
        if ((commaInReferrence != commaLessThan + parseInt(options.difference))) {
          //justValueのチェック、justValueが無効化されているかもチェック
          if (options.justValue == -1 || commaLessThan != options.justValue) {
            const command = CommandUtil.getCommand(attributes['_command_id'])
            const label = CommandUtil.getCommandParamLabel(command, key)
            const targetLabel = CommandUtil.getCommandParamLabel(command, options.target)
            var errorMessage = []

            if (options.difference == 0) {
              errorMessage.push('[' + label + '] ' + 'と、[' + targetLabel + ']の項目数が同じになるよう入力してください。')
            } else {
              errorMessage.push('[' + label + '] ' + 'への入力項目の数より、[' + targetLabel + ']への入力項目の数が' + options.difference + 'つ多くなるよう入力してください。')
            }

            if (options.justValue != -1) {
              errorMessage.push('もしくは、[' + label + '] ' + 'への入力項目の数が' + options.justValue + 'つでも対応することができます。')
            }
            return errorMessage
          }
        }
      }

      return null
    }

    //---------------------------------------------
    /*
    checkSeveralSpecifiedFormats
    入力条件に応じて複数の正規表現を適用する

    looserPatternThanDefault
    defaultよりも条件がゆるい特別ルールがある場合、それ基準に他のオプションの正規表現を作る必要があるため、defaultRuleの扱いが大きく変わる。
    範囲が大きくなるオプションを適用せず、範囲を小さくするオプションを使用する場合では、defaultを適用する必要がある。
    だが、範囲を大きくするオプションを適用した場合、defaultは適用してはならない。

    使い方(m2cross)
    "f" : {
      "checkSeveralSpecifiedFormats" : {
        "defaultRule" : {
          "pattern" : "^[^,]+$",
          "message" : "一項目のみ入力してください"
        },
        "specialRules" : [
          {
            "target" : "a",
            "pattern" : "^[^,]+(,[^,]+)*$",
            "message" : "複数項目入力時は,(コンマ)で区切ってください",
            "looserPatternThanDefault" : true
          },{
            "target" : ["x", "nfn"],
            "pattern" : "^[1-9]?[0-9]+(-[1-9]?[0-9]+)?L?(,[1-9]?[0-9]+(-[1-9]?[0-9]+)?L?)*$",
            "message" : "項目の指定は数値のみ可能です。"
          }
        ]
      }
   }
    */
    //---------------------------------------------

    ValidateJS.validators.checkSeveralSpecifiedFormats = function (value, options, key, attributes) {
      var errorMessage = []
      if (options && value) {
        // defaultRuleのみの入力を許容する、formatにも代えられるようにする
        if (options.specialRules) {
          var useSpecialFlg = false
          var isLooserUnused = false
          for (var spRule in options.specialRules) {
            var targetInput = false
            var specialRules = options.specialRules[spRule]
            var useLooserPatternFlg = false
            if (Array.isArray(specialRules.target)) {

              (specialRules.target).forEach((target) => {
                targetInput = (isValueExist(target) || targetInput) ? true : targetInput
              })
            } else {
              targetInput = isValueExist(specialRules.target)
            }
            if (specialRules.looserPatternThanDefault) useLooserPatternFlg = true

            // 適用判定
            if (targetInput) {
              useSpecialFlg = true
              errorMessage.push(ValidateJS.validators.getRuleMessage(value, specialRules))
            } else if (useLooserPatternFlg) {
              isLooserUnused = true
            }
          }
          // looserPatternThanDefaultがあるにも関わらず、それを使用しなかった場合、defaultRuleを適用する必要がある。
          // 基本defaultRuleが基準となる
          // looserPatternThanDefaultがあるオプションを適用した場合、その基準はlooserPatternThanDefaultになるためである。
          if (!useSpecialFlg || isLooserUnused) {
            errorMessage.push(ValidateJS.validators.getRuleMessage(value, options.defaultRule))
          }
        } else {
          errorMessage.push(ValidateJS.validators.getRuleMessage(value, options.defaultRule))
        }
        removeBadValue(errorMessage)
        return (errorMessage.length == 0) ? null : errorMessage
      }

      function removeBadValue (errorMessage) {
        for (var i = 0; i < errorMessage.length; i++) {
          if (errorMessage[i] == null || errorMessage[i] == undefined) {
            errorMessage.splice(i, 1)
            if (i > 0) i--
          }
        }
        return errorMessage
      }

      function isValueExist (target) {
        return attributes[target] ? true : false
      }
    }

    //---------------------------------------------
    // checkArrangementSequences
    // 
    // 入力された「数値」の並び方が正しいかどうか確認
    // 注)これは現在数値のみ対応、内部の文字列は取り除く処理をしている
    // 
    // 使い方
    // "rules" : {
    //   "R" : {
    //     checkArrangementSequences : true
    //   }
    // }
    //---------------------------------------------
    ValidateJS.validators.checkArrangementSequences = function (value, options, key, attributes) {
      var isError = false
      // if(options && value){
      if (value) {
        var onlyNumber = []
        var listedValue = value.split(',')
        // 文字列の抜き取りと、数値のリスト化
        listedValue.forEach((numOKstrNG) => {
          var changeNum = Number(numOKstrNG)
          if (!isNaN(changeNum)) {
            onlyNumber.push(changeNum)
          }
        })

        // 数値の大小の順序比較
        var referenceVal = -Infinity
        onlyNumber.forEach((checkNum) => {
          if (referenceVal <= checkNum) {
            referenceVal = checkNum
          } else {
            isError = true
          }
        })
      }
      return (isError) ? '範囲を指定する数値は小さい順に入力してください' : null
    }

  }

  schemaValidate (schema, state) {
    const valid = this.ajv.validate(schema, state)
    if (!valid) {
      LogUtil.error(this.ajv.errorsText() + ' by ' + schema.$id, state)
      return false
    }
    return true
  }

  isFlowModelSchema (state) {
    return this.schemaValidate(FlowModelSchema, state)
  }

  isGraphModelSchema (state) {
    return this.schemaValidate(GraphModelSchema, state)
  }

  isNodesSchema ({nodes}) {
    let success = true
    nodes.forEach((node) => {
      let schema
      if (node instanceof DataFrameStepModel) {
        schema = DataFrameStepModelSchema
      } else if (node instanceof SubFlowStepModel) {
        schema = SubFlowCommandModeSchema
      } else if (node instanceof CommandStepModel) {
        schema = CommandStepModelSchema
      } else if (node instanceof NoteStepModel) {
        schema = NoteStepModelSchema
      }
      const result = this.schemaValidate(schema, node)
      if (!result) success = false
    })
    return success
  }

  isFlowModelSchema (state) {
    return this.schemaValidate(FlowModelSchema, state)
  }

  nodesValidate (nodes) {
    return nodes.forEach((node) => {
      node.validate()
    })
  }
}

export default new ValidatorUtil()
