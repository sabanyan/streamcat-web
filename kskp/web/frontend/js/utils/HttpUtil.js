//@flow
import axios from 'axios'
import NavigationModel from 'Model/Navigation/NavigationModel'

class HTTPUtil {
  config: {}

  constructor () {
    //default config
    this.config = {}

    axios.interceptors.response.use((response) => {
      this.setWindowNavigation(response)
      return response
    })
  }

  setWindowNavigation (response: any) {
    if (response.data.navigation) {
      new NavigationModel(response.data.navigation)
    }
  }

  mergeConfig (config?: {}) {
    if (config) {
      return Object.assign(this.config, config)
    }
  }

  httpUrl (path: string) {
    return '/' + path
  }

  windowOpen (path: string, callBackApply: Function, option: string = 'width=1200,height=600') {
    window.open('/' + path, 'child', option)
    window['onCallbackApply'] = callBackApply
  }

  get (path: string, data?: {}, config?: {}) {
    const merged_config = this.mergeConfig(config)
    const url = this.httpUrl(path)
    return axios.get(url, {params: data}, merged_config)
  }

  post (path: string, data: {}, config?: {}) {
    const merged_config = this.mergeConfig(config)
    const url = this.httpUrl(path)
    return axios.post(url, data, merged_config)
  }

  put (path: string, data: {}, config?: {}) {
    const merged_config = this.mergeConfig(config)
    const url = this.httpUrl(path)
    return axios.put(url, data, merged_config)
  }

  delete (path: string, data: {}, config: {}) {
    const merged_config = this.mergeConfig(config)
    const url = this.httpUrl(path)
    return axios.delete(url, data, merged_config)
  }

  getURLParam (paramName: string) {
    var url_string = window.location.href
    var url = new URL(url_string)
    return url.searchParams.get(paramName)
  }
}

//Singleton
//ref:https://qiita.com/hkusu/items/d9ac2bd135e9e579e018
export default new HTTPUtil()