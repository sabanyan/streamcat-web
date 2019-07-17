export default class Model {
  initialize (props:{}, key:string) {
    if (props) {
      if (props[key]) this[key] = props[key]
    }
  }
}