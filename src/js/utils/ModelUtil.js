import Constants from '../constants'

export default class ModelUtil {
  // TODO 将来変更予定
  static getId () {
    return 's' + Math.floor(Math.random() * 10000)
  }

  // TODO 将来変更予定
  static isDataSouceModel (step) {
    return (step.type === 'csv')
  }
}

