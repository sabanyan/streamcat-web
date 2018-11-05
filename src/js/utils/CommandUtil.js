//@flow

import type { CommandParamType } from '../types'
import CommandModel from '../model/Command/CommandModel'

export default class CommandUtil {
  static getCommand(id:string):CommandModel {
    if (window.commands) {
      const command = window.commands.find((command) => {
        console.log("COMMAND", command.id)
        if (command.id === id) {
          return true
        }
      })
      console.log("COMMAND",command)
      return command
    }
    return null
  }

  static getCommandParamLabel(command:CommandModel,name:string):string {
    const foundParam:CommandParamType = command.params.find((param)=>{
      return (param.name === name)
    })
    console.log("foundParam",command)
    if(!foundParam)return null
    return foundParam.label
  }
}