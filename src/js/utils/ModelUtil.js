import Constants from '../constants'

export default class ModelUtil {
  static getId () {
    return "s" + Math.floor(Math.random() * 10000)
  }
}

