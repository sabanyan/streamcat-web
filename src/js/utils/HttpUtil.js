//@flow
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

  setWindowNavigation(response:any){
    if(response.data.navigation){
      new NavigationModel(response.data.navigation)
    }
  }

  mergeConfig (config:{}) {
    if (config) {
      return Object.assign(this.config, config)
    }
  }

  apiUrl (path:string) {
    return '/api/v0/' + path
  }

  get (path:string, data:{}, config:{}) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.get(url, {params: data}, merged_config)
  }

  post (path:string, data:{}, config:{}) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.post(url, data, merged_config)
  }

  put (path:string, data:{}, config:{}) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.put(url, data, merged_config)
  }

  fileupload(file:File,fileName:string){
    const options = {
      headers: { 'enctype': 'multipart/form-data' }
    }

    let formData:FormData = new FormData();
    formData.append('file', file)
    formData.append('file_name', fileName)

    return this.post('frames', formData,options)
  }

  delete (path:string, data:{}, config:{}) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.delete(url, data, merged_config)
  }

  getURLParam(paramName:string){
    var url_string = window.location.href
    var url = new URL(url_string);
    return url.searchParams.get(paramName);
  }
}



//Singleton
//ref:https://qiita.com/hkusu/items/d9ac2bd135e9e579e018
export default new HTTPUtil()