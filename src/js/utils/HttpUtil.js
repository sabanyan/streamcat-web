import axios from 'axios'
import Constants from '../constants'
import NavigationModel from '../model/Navigation/NavigationModel'

class HTTPUtil {
  constructor () {
    //default config
    this.config = {}

    axios.interceptors.response.use((response) => {
      this.setWindowNavigation(response)
      return response
    });
  }

  setWindowNavigation(response){
    if(response.data.navigation){
      new NavigationModel(response.data.navigation)
    }
  }

  mergeConfig (config) {
    if (config) {
      return Object.assign(this.config, config)
    }
  }

  apiUrl (path) {
    return '/api/v0/' + path
  }

  get (path, data, config) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.get(url, {params: data}, merged_config)
  }

  post (path, data, config) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.post(url, data, merged_config)
  }

  put (path, data, config) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.put(url, data, merged_config)
  }

  delete (path, data, config) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.delete(url, data, merged_config)
  }
}

//Singleton
//ref:https://qiita.com/hkusu/items/d9ac2bd135e9e579e018
export default new HTTPUtil()