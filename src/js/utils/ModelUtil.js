//@flow
import Constants from '../constants'
import type { StepModelType } from '../types'

export default class ModelUtil {
  /**
   * フロントエンドで発行するUUID
   * "new RRRRRRRR-RRRR-4RRR-rRRR-RRRRRRRRRRRR" というフォーマットで発行される
   * @returns {string}
   */
  static getNewId ():string {
    return 'new ' +this.generateUUID()
  }

  /**
   * 乱数による UUID バージョン4
   * @returns {string}
   */
  static generateUUID():string{
    // ref:https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
    // 乱数によるUUID。16進表記ではRRRRRRRR-RRRR-4RRR-rRRR-RRRRRRRRRRRRとなり、バリアント(10)とバージョン(0100)を除くすべてのビットを乱数（R:122ビット）で生成する。
    let chars = Constants.default.uuid.v4Format.split("");
    for (let i = 0, len = chars.length; i < len; i++) {
      switch (chars[i]) {
        case "x":
          chars[i] = Math.floor(Math.random() * 16).toString(16);
          break;
        case "y":
          chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
          break;
      }
    }
    return chars.join("");
  }
}

