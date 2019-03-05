// @flow
export default class WebUtil {
  static navigateURL(url:string){
    window.location.href = url
  }
  static webURL(url:string):string{
    url = url.replace("./","/")
    return window.location.protocol + "//" +  window.location.host + url
  }
}