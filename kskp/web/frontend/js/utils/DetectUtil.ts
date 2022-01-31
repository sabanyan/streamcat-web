//@flow

export default class DetectUtil {
  static isMac (): boolean {
    return (navigator.userAgent.indexOf('Mac') !== -1)
  }

  static isWin (): boolean {
    return (navigator.userAgent.indexOf('Win') !== -1)
  }
}