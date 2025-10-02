//@flow

export default class DetectUtil {
  static isMac (): boolean {
    return navigator.userAgent.includes('Mac');
  }

  static isWin (): boolean {
    return navigator.userAgent.includes('Win');
  }
}