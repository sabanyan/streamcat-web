import React from 'react'
import PropTypes from 'prop-types'
import DataSourceModel from '../../../../model/DataSourceModel'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../../shared/DataTable/index'
import Operator from '../../../shared/Operator/index'

class DataSourceInspector extends React.Component {

    componentWillMount() {
        const self = this

        //モーダル処理の登録
        ModalUtil.registerModal({
            id: Constants.preview.DATASOURCE, onClickOK: () => {
                ModalUtil.emitModal({id: Constants.preview.DATASOURCE, visible: false})
            }
        })
    }

    onClickPreview(e) {

      const self = this
      let option = {
        method: 'GET',
        mode: 'same-origin',
        credentials: 'include',
        redirect: 'follow',
      }

      //ファイル名を steps の パラメータから取得する
      const filename = this.props.steps[this.props.selected_step_ids[0]].getFileName()

      fetch("http://"+Constants.api.host+"/api/v0-1/dataframe/"+ filename, option).then(function (response) {
        console.log(response)
        if (response.ok) {
          return response.json()
        } else {
          alert("サーバでエラーが発生しました")
        }
      }).then(function (json) {
        console.log(json)
        if(json){
          const content = <DataTable json={json}/>
          ModalUtil.emitModal({
            id: Constants.preview.DATASOURCE,
            visible: true,
            content: content,
            title: filename
          })
        }else{
          alert("サーバからの応答結果がありません")
        }
      }).catch((err) => {
        console.log(err)
        alert("クライアントでエラーが発生しました")
      })

    }

    onClickDelete(e) {
      if(window.confirm("このデータソースを削除しますか？")) {
        let {selected_step_ids, steps} = this.props
        const selected_step = steps[selected_step_ids[0]]
        this.props.deleteStep(selected_step)
        this.props.selectSteps()
      }
    }

    render() {

        let step_text
        let property
        let dataSource
        let preview
        let {selected_step_ids,steps} = this.props
        const self = this
        const selected_step = steps[selected_step_ids[0]]
        if (selected_step instanceof DataSourceModel) {
            dataSource = selected_step
            step_text = selected_step.text
            if(dataSource.property.hasData){
                preview = <div className="action" onClick={(e) => self.onClickPreview(e)}>
                    <i className="icon material-icons">visibility</i>
                    <div className="label">
                      プレビュー
                    </div>
                  </div>
            }
        }

        let operators = this.props.mast.operators.map((operator, index) => {
            return <Operator {...operator} {...this.props} key={index}></Operator>
            // switch (operation) {
            //     case Constants.operatorType.msortf:
            //         return <Sort key={index}/>
            //         break;
            //     case Constants.operatorType.mcal:
            //         return null
            //         break;
            //     case Constants.operatorType.mcut:
            //         return <Mcut key={index}/>
            //         break;
            //     case Constants.operatorType.mtra2g:
            //         return null
            //         break;
            //     case Constants.operatorType.mitemset:
            //         return null
            //         break;
            // }
        })

        return <div className="kskp-property-container">
            <div className="kskp-property-header">
                {step_text}
            </div>
            <div className="kskp-property-body">
                <div className="kskp-property-title">
                    データの概要
                </div>
                <div className="kskp-property-overview">
                    <div className="overviews">
                        <div className="overview">
                            <div className="label">
                                データの件数
                            </div>
                            <div className="value">
                                {/*{property.overview.count || 0}*/}
                            </div>
                        </div>
                        <div className="overview">
                            <div className="label">
                                作成日
                            </div>
                            <div className="value">
                                {/*{property.overview.created_at || ""}*/}
                            </div>
                        </div>
                        <div className="overview">
                            <div className="label">
                                作成者
                            </div>
                            <div className="value">
                                {/*{property.overview.created_user_name || ""}*/}
                            </div>
                        </div>
                    </div>
                    <div className="actions">
                        {preview}
                        {/*<div className="action">*/}
                            {/*<i className="icon material-icons">share</i>*/}
                            {/*<div className="label">*/}
                                {/*シェア*/}
                            {/*</div>*/}
                        {/*</div>*/}
                        {/*<div className="action">*/}
                            {/*<i className="icon material-icons">open_in_new</i>*/}
                            {/*<div className="label">*/}
                                {/*エクスポート*/}
                            {/*</div>*/}
                        {/*</div>*/}
                        <div className="action danger" onClick={(e) => this.onClickDelete(e)}>
                            <i className="icon material-icons">delete</i>
                            <div className="label">
                                削除
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hr"/>
                <div className="kskp-property-title">
                    データの操作（基本）
                </div>
                <div className="kskp-property-basic-operators">
                    {operators}
                </div>
                {/*<div className="kskp-property-title">*/}
                    {/*データの操作（カスタム）*/}
                {/*</div>*/}
                {/*<div className="kskp-property-custom-operators">*/}
                    {/*<div className="operator">*/}
                        {/*<i className="icon none"/>*/}
                        {/*<div className="label">在庫から販売予測</div>*/}
                    {/*</div>*/}
                {/*</div>*/}

            </div>
        </div>
    }

}

export default DataSourceInspector