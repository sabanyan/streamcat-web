//@flow
import Constants from '../constants'

export default class DetectUtil {
  static isMac ():boolean {
    return (navigator.appVersion.indexOf('Mac') != -1)
  }

  static isWin ():boolean {
    return (navigator.appVersion.indexOf('Win') != -1)
  }
}