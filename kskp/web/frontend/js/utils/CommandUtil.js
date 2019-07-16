//@flow

import type { CommandParamType } from '../types'
import CommandModel from '../model/Command/CommandModel'

export default class CommandUtil {
  static getCommand (id: string): CommandModel {
    if (window.commands) {
      const command = window.commands.find((command) => {
        if (command.id === id) {
          return true
        }
      })
      return command
    }
    return null
  }

  static getCommandParamLabel (command: CommandModel, name: string): string {
    const foundParam: CommandParamType = command.params.find((param) => {
      return (param.name === name)
    })
    if (!foundParam) return null
    return foundParam.label
  }
}