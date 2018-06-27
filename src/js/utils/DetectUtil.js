import Constants from '../constants'

export default class DetectUtil {
  static isMac () {
    return (navigator.appVersion.indexOf('Mac') != -1)
  }

  static isWin () {
    return (navigator.appVersion.indexOf('Win') != -1)
  }
}