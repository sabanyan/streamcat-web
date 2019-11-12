//@flow
import type { CommandStepModelProps } from 'Model/Step/CommandStepModel'
import { CommandStepModel, SubflowCommandModel } from 'Model/index'
import type { CommandParamType } from 'Types/index'

export type SubFlowStepModelProps = {
  ...CommandStepModelProps,
  uuid: string
}

export default class SubFlowStepModel extends CommandStepModel {
  uuid: string

  constructor (props: SubFlowStepModelProps) {
    super(props)
    this.initialize(props, 'srcs')
    this.initialize(props, 'srcsOrder')
    this.initialize(props, 'dsts')
    this.initialize(props, 'args')
    this.initialize(props, 'commandId')
    this.initialize(props, 'uuid')
    if (Object.keys(this.srcs) != 0 && this.srcsOrder.length == 0) {
      this.srcsOrder = Object.keys(this.srcs)
    }
    this.args = this.initArgs(props.args)
  }

  initArgs(args:{}) {
    let result = {}
    try {
      const command = this.getCommand()
      if (!command) throw "command is undefined in CommandStepModel"
      if (!command.params) throw "command.params is undefined in CommandStepModel"
      const params = command.params
      const rules = (command.rules) ? command.rules : {}
      params.map((param:CommandParamType) => {
        // 1.ルールの適用
        const rule = rules[param.name]
        // rule: 必須項目で空白（""）が許される場合
        if (rule && rule["presence"] && ["presence"]["allowEmpty"] === true) result[param.name] = ""
        // 2.default値の適用
        if (param.default) result[param.name] = param.default
        // 3.保存されたユーザー入力値の適用
        if (args[param.name]) result[param.name] = args[param.name]
      })
    } catch(e) {
      console.log(e)
    }
  
    return result
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
