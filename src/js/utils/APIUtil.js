//@flow
import axios from 'axios'
import Constants from '../constants'
import NavigationModel from '../model/Navigation/NavigationModel'

class APIUtil {
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

  mergeConfig (config?:{}) {
    if (config) {
      return Object.assign(this.config, config)
    }
  }

  apiUrl (path:string) {
    return '/api/v0/' + path
  }

  get (path:string, data?:{}, config?:{}) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.get(url, {params: data}, merged_config)
  }

  post (path:string, data:{}, config?:{}) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.post(url, data, merged_config)
  }

  put (path:string, data:{}, config?:{}) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.put(url, data, merged_config)
  }

  delete (path:string, data:{}, config:{}) {
    const merged_config = this.mergeConfig(config)
    const url = this.apiUrl(path)
    return axios.delete(url, data, merged_config)
  }

  frameUpload(file:File,fileName:string,label:string,parentUUID:string){
    const options = {
      headers: { 'enctype': 'multipart/form-data' }
    }

    let formData:FormData = new FormData();
    console.log(parentUUID)
    console.log(label)
    formData.append('file', file)
    if(fileName){
      formData.append('file_name', fileName)//TODO 将来的にはなくなる？？
    }
    if(label){
      formData.append('label', label)
    }
    if(parentUUID){
      formData.append('parent', parentUUID)
    }

    return this.post('frames', formData,options)
  }
  documentUpload(file:File,label:string,parentUUID:string){
    const options = {
      headers: { 'enctype': 'multipart/form-data' }
    }

    let formData:FormData = new FormData();
    formData.append('file', file)
    if(label){
      formData.append('label', label)
    }
    if(parentUUID){
      formData.append('parent', parentUUID)
    }

    return this.post('documents', formData,options)
  }

}



//Singleton
//ref:https://qiita.com/hkusu/items/d9ac2bd135e9e579e018
export default new APIUtil()