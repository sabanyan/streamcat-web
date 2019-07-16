//@flow
import _ from 'lodash'

export default class State {
  /**
   * DeepCopy
   * @param obj
   * @returns {Blob|ArrayBuffer|Array|Array.<T>|string|*}
   */
  static deepCopy (obj: {}): any {
    return _.cloneDeep(obj)
  }
}