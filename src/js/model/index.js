//@flow
export default class Model {
  initialize (props, key) {
    if (props) {
      if (props[key]) this[key] = props[key]
    }
  }
}