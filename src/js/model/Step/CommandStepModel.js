//@flow
import { BaseStepModel } from 'Model/index'
import BaseModelProps from 'Model/Step/BaseStepModel'
import type { CommandParamType } from 'Types/index'
import CommandModel from 'Model/Command/CommandModel'
import validateJS from 'validate.js'
import arrayMove from 'array-move'
import Constants from '../../constants'

type stepType = 'command' | 'frame'

export type CommandStepModelProps = {
  ...BaseModelProps,
  srcs: {};
  srcsOrder: [];
  dsts: {};
  args: {};
  commandId: string;
  getSrcsSteps: Function;
  getDstsSteps: Function;
  getCommand: Function;
}

export default class CommandStepModel extends BaseStepModel {
  srcs: {} = {}
  srcsOrder: [] = []
  dsts: {} = {}
  args: {} = {}
  commandId: string

  constructor (props: CommandStepModelProps) {
    super(props)
    this.initialize(props, 'srcs')
    this.initialize(props, 'srcsOrder')
    this.initialize(props, 'dsts')
    this.initialize(props, 'args')
    this.initialize(props, 'commandId')
    if (Object.keys(this.srcs) != 0 && this.srcsOrder.length == 0) {
      this.srcsOrder = Object.keys(this.srcs)
    }
    this.initCommandArgs()
  }

  initCommandArgs() {
    // SubflowStepModelがCommandStepModelを継承する場合があるため
    if (!(this.type === Constants.step.type.command)) {
      return
    }
    const command: CommandModel = this.getCommand()
    if (!command || !(command.params) || !(Array.isArray(command.params))) {
      return
    }
    command.params.map((param) => {
      // default値がある場合、設定する
      if(param.default && !(this.args[param.name])) {
        this.args[param.name] = param.default
      }
    })
  }

  getStep (nodes, key) {
    let step = nodes.find((node) => {
      return node.id === key
    })
    return step
  }

  /**
   * 指定されたポートを削除する
   * @param key
   */
  deleteInPort (key) {
    delete this.srcs[key]
    // delete
    let srcsOrder = []
    this.srcsOrder.forEach((srcKey, index) => {
      if (srcKey !== key) {
        srcsOrder.push(srcKey)
      }
    })
  }

  /**
   * 指定されたポートを削除する
   * @param key
   */
  addInPort (key, value) {
    this.srcs[key] = (value) ? value : null
    this.srcsOrder.push(key)
  }

  /**
   * 指定されたポート名の最大値を求める
   * @param key
   */
  getInPortIndex () {
    const srcKeys = Object.keys(this.srcs)

    const filterKeys = srcKeys.filter((key) => {
      return (key.indexOf('*') != -1)
    })

    let max = 0
    filterKeys.forEach((key) => {
      const value = key.replace('*', '')
      max = (value > max) ? value : max
    })

    return parseInt(max)
  }

  /**
   * 入力ポートを追加できるか
   */
  addableInPort () {
    // コマンドが複数入力可能かどうかを判断するため、元のコマンドのInPort定義に＊があるか確認する
    const filterKeys = this.getCommand().getInPorts().filter((inPort) => {
      return (inPort.name.indexOf('*') != -1)
    })
    return (filterKeys.length)
  }

  getSrcsSteps (nodes) {
    let steps = {}
    Object.keys(this.srcs).forEach((key) => {
      const stepId = this.srcs[key]
      steps[stepId] = {
        id: stepId,
        portName: key,
        node: this.getStep(nodes, stepId)
      }
    })
    return steps
  }

  getDstsSteps (nodes) {
    let steps = {}
    return Object.keys(this.dsts).map((key) => {
      const stepId = this.dsts[key]
      steps[stepId] = this.getStep(nodes, stepId)
    })
    return steps
  }

  getCommand (): CommandModel {
    let command = null
    window.commands.forEach((_command) => {
      if (this.commandId === _command.id) {
        command = _command
      }
    })
    return command
  }

  getLabel () {
    if (this.label == this.id) {
      return this.getCommand().label
    }

    return this.label
  }

  onSortEnd (oldIndex, newIndex) {
    this.srcsOrder = arrayMove(this.srcsOrder, oldIndex, newIndex)
    // ソート後,連番をリーネムする。
    let renamedSrcsOrder = []
    let renaemdSrcs = {}
    let portIndex = 1
    this.srcsOrder.forEach((srcKey, index) => {
      let temp = srcKey
      if (temp.indexOf('*') == 0) {
        temp = '*' + portIndex
        portIndex++
      }
      // SrcsのKeyをリーネムする
      renaemdSrcs[temp] = this.srcs[srcKey]
      // SrcsOrderの連番をリーネムする
      renamedSrcsOrder.push(temp)
    })

    this.srcs = renaemdSrcs
    this.srcsOrder = renamedSrcsOrder
  }

  validate () {
    this.invalid = {}
    //必須バリデーション
    let command: CommandModel = this.getCommand()
    Object.keys(command.getParams()).map(key => {
      const param: CommandParamType = command.getParam(key)
      const value = this.args[key]
      //TODO:param.optionalはrulesに移行予定
      // if(!param.optional){
      //   if(value === "" || value === null){
      //     this.invalid[key] = "入力が必須の項目です"
      //   }
      // }
      const args = {...this.args, ...{'_command_id': command.id}}
      const result = validateJS(args, command.rules)
      if (result) {
        Object.keys(result).forEach((key) => {
          this.invalid[key] = result[key]
        })
      }
    })

  }
}