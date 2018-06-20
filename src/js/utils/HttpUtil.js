import axios from 'axios'
import Constants from '../constants'

class HTTPUtil {
  constructor () {
    //default config
    this.config = {}
  }

  mergeConfig (config) {
    if (config) {
      return Object.assign(this.config, config)
    }
  }

  apiUrl (path) {
    return '/api/v0/' + path
  }

  get (path, config) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.get(url, merged_config)
  }

  post (path, data, config) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.post(url, data, merged_config)
  }

}

//Singleton
//ref:https://qiita.com/hkusu/items/d9ac2bd135e9e579e018
export default new HTTPUtil()