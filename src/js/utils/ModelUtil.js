//@flow
import Constants from 'Constants/index'
import ErrorUtil from 'Utils/ErrorUtil'

export default class ModelUtil {
  /**
   * フロントエンドで発行するUUID
   * "d1,c1,f1" というフォーマットで発行される
   * @returns {string}
   */
  static getNewId (type: string, nodes: []): string {
    let prefix: string = ModelUtil.getTypePrefix(type)
    let Id: string = ModelUtil.getMinimumIDNumberFromNodes(type)
    return prefix + Id
  }

  static getTypePrefix (type: string): string {
    let prefix: string = ''
    switch (type) {
      case Constants.step.type.frame:
        prefix = 'd'
        break
      case Constants.step.type.subflow:
        prefix = 'f'
        break
      case Constants.step.type.command:
        prefix = 'c'
        break
      case Constants.step.type.note:
        prefix = 'n'
        break
      default:
        new ErrorUtil('想定している型とは異なる型が指定されました')
    }
    return prefix
  }

  static getMinimumIDNumberFromNodes (type: string): string {
    let prefix: string = ModelUtil.getTypePrefix(type)
    let idNumber: string = ''
    for (let index = 1; index <= window.nodes.length; index++) {
      idNumber = index.toString()
      const found = window.nodes.find((node) => {
        return (node.id === prefix + index)
      })
      if (found) {
      } else {
        return idNumber
      }
    }
    return idNumber
  }

  /**
   * 乱数による UUID バージョン4
   * @returns {string}
   */
  static generateUUID (): string {
    // ref:https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
    // 乱数によるUUID。16進表記ではRRRRRRRR-RRRR-4RRR-rRRR-RRRRRRRRRRRRとなり、バリアント(10)とバージョン(0100)を除くすべてのビットを乱数（R:122ビット）で生成する。
    let chars = Constants.default.uuid.v4Format.split('')
    for (let i = 0, len = chars.length; i < len; i++) {
      switch (chars[i]) {
        case 'x':
          chars[i] = Math.floor(Math.random() * 16).toString(16)
          break
        case 'y':
          chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16)
          break
      }
    }
    return chars.join('')
  }
}

