//@flow
import type { CommandParamType } from 'Types/index'
import { Command } from 'Model/Library';

export default class CommandUtil {

  static getCommand (id: string){
    // windowオブジェクトに格納されているCommand配列を取得する
    const commands = window.commands as any[];
    // command配列が無い、または配列型で無い場合はnullを返す
    if(!commands || !(commands instanceof Array)){
      return null;
    }
    // idに一致するcommandを取得する
    return commands.find(command => command.id === id) as Command;
  }

  static getCommandParamLabel (command: Command | null, name: string): string | null{
    if(!command){
      return null;
    }
    const foundParam = command.params.find(param => param.name === name) as CommandParamType;
    return foundParam && foundParam.label
  }
}
