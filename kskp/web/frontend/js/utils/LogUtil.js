//@flow
class LogUtil {
  constructor () {

  }

  error (message, params) {
    const style = 'color: red'
    if (params) {
      //console.log('%c' + message, style)
      //console.log(params)
    } else {
      //console.log('%c' + message, style)
    }
  }
}

export default new LogUtil()