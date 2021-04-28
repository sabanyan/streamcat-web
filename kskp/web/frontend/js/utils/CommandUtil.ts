//@flow

import type { CommandParamType } from 'Types/index'
import CommandModel from 'Model/Command/CommandModel'

export default class CommandUtil {
  static getCommand (id: string): CommandModel | null {
    if (window.commands && Array.isArray(window.commands)) {
      const command = window.commands.find((command:any) => {
        if (command.id === id) {
          return true
        }
        return false
      })
      return command
    }
    return null
  }

  static getCommandParamLabel (command: CommandModel, name: string): string | null {
    const foundParam: CommandParamType = command.params.find((param) => {
      return (param.name === name)
    })
    if (!foundParam) return null
    return foundParam.label
  }
}