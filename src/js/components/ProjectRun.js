import React from 'react'
import ModalUtil from '../utils/ModalUtil'
import Constants from '../constants'
import DataTable from '../components/DataTable'
export default class CanvasZoom extends React.Component {
  onClickSave(){
    this.save().then((json)=>{
      if(json){
        ModalUtil.emitModal({
          id: Constants.modal.SHOW_MESSAGE,
          visible: true,
          title: "保存完了",
          content: <div>フローを保存しました</div>
        })
      }
    })
  }
  onClickSort(){
    this.props.sortFlowAction()
  }

  save(){
    return new Promise((resolve,reject)=>{
      let {selected_step_ids,steps,edges} = this.props

      const flow_json_text = {
        flow_json_text:{
          project_uuid: inject_project_uuid,
          name: inject_initial_flow_data.name,
          steps: steps,
          edges: edges,
        }
      }

      let option = {
        method: 'POST',
        body: JSON.stringify(flow_json_text),
        mode: 'same-origin',
        credentials: 'include',
        redirect: 'follow',
        headers: {
          'content-type': 'application/json'
        },
      }

      fetch("http://"+Constants.api.host+"/api/v0-1/flows/"+ inject_flow_uuid +"/update", option).then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          alert("サーバでエラーが発生しました")
          reject()
        }
      }).then(function (json) {
        resolve(json)
      }).catch((err) => {
        console.log(err)
        alert("クライアントでエラーが発生しました")
        reject(err)
      })
    })

  }

  run(){
    return new Promise((resolve,reject)=> {
      let option = {
        method: 'GET',
        mode: 'same-origin',
        credentials: 'include',
        redirect: 'follow',
      }

      fetch("http://"+Constants.api.host+"/api/v0-1/flows/"+ inject_flow_uuid +"/execute", option).then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          alert("サーバでエラーが発生しました")
        }
      }).then(function (json) {
        resolve(json)
      }).catch((err) => {
        console.log(err)
        alert("クライアントでエラーが発生しました")
        reject(err)
      })
    })

  }

  onClickProjectRun(){
    const self = this
    this.save().then(()=>{
      self.run().then((json)=>{
        const content = <DataTable json={json}/>
        ModalUtil.emitModal({
          id: Constants.preview.DATASOURCE,
          visible: true,
          content: content,
          title: inject_initial_flow_data.name
        })
        //TODO 将来的に修正する（executeFlowAction は hasData = true に変更するためだけの処理になっています）
        self.props.executeFlowAction()
      })
    })
  }
  render () {
    return <div className="btn-group kskp-canvas-tool action">
      <button type="button" className="btn btn-default btn-sm save" onClick={(e)=>this.onClickSave(e)}>
        <div className="icon">
          <i className="icon material-icons">&#xE2C2;</i>
        </div>
        <div className="text">
          保存
        </div>
      </button>
      <button type="button" className="btn btn-default btn-sm layout" onClick={(e)=>this.onClickSort(e)}>
        <div className="icon">
          <i className="icon material-icons">&#xE42A;</i>
        </div>
        <div className="text">
          整列
        </div>
      </button>
      <button type="button" className="btn btn-default btn-sm run" onClick={(e)=>this.onClickProjectRun(e)}>
        <div className="icon">
          <i className="icon material-icons">&#xE037;</i>
        </div>
        <div className="text">
          プロジェクト実行
        </div>
      </button>
      <button type="button" className="btn btn-default btn-sm abort" disabled={true}>
        <div className="icon">
          <i className="icon material-icons">&#xE034;</i>
        </div>
        <div className="text">
          実行を中止
        </div>
      </button>
      <button type="button" className="btn btn-default btn-sm dry-run" disabled={true}>
        <div className="icon">
          <i className="icon material-icons">&#xE044;</i>
        </div>
        <div className="text">
          ドライラン
        </div>
      </button>
      <button type="button" className="btn btn-default btn-sm download" disabled={true}>
        <div className="icon">
          <i className="icon material-icons">&#xE2C4;</i>
        </div>
        <div className="text">
          ダウンロード
        </div>
      </button>
    </div>
  }
}