// @flow
import React from 'react'
import DataSourceModel from '../../../../model/DataSourceModel'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import Operator from '../../../shared/Operator/index'
import Inspector from '../Inspector'
import style from '../style.scss'
import classnames from 'classnames'
import type { FlowEditorProps } from '../../index'
import Button from '../../../shared/Button'
import DataPreview from '../../../shared/DataPreview'
import DropDownList from '../../../shared/DropDownList'


class DataSourceInspector extends React.Component<FlowEditorProps> {

    componentWillMount() {
        const self = this

        //モーダル処理の登録
        ModalUtil.registerModal({
            id: Constants.preview.DATASOURCE, onClickOK: () => {
                ModalUtil.emitModal({id: Constants.preview.DATASOURCE, visible: false})
            }
        })
    }

    onClickPreview(e:Event) {

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
          const content = <DataPreview json={json}/>
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

    onClickDelete(e:Event) {
      if(window.confirm("このデータソースを削除しますか？")) {
        let {selected_step_ids, steps} = this.props
        const selected_step = steps[selected_step_ids[0]]
        this.props.deleteSteps([selected_step.id])
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
              preview = <Button onClick={(e) => self.onClickPreview(e)} icon={"visibility"}>プレビュー</Button>
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



        return <Inspector header={step_text} title={"データの概要"}>
                <div className={style.property_overview}>
                  <div className={style.actions}>
                    {preview}
                    <Button onClick={(e) => self.onClickDelete(e)} icon={"delete"} danger={true}>削除</Button>
                  </div>
                  <div className={style.overviews}>
                      <div className={style.overview}>
                          <div className={style.overview_label}>
                              データの件数
                          </div>
                          <div className={style.overview_value}>
                              {/*{property.overview.count || 0}*/}
                          </div>
                      </div>
                      <div className={style.overview}>
                          <div className={style.overview_label}>
                              作成日
                          </div>
                          <div className={style.overview_value}>
                              {/*{property.overview.created_at || ""}*/}
                          </div>
                      </div>
                      <div className={style.overview}>
                          <div className={style.overview_label}>
                              作成者
                          </div>
                          <div className={style.overview_value}>
                              {/*{property.overview.created_user_name || ""}*/}
                          </div>
                      </div>
                    </div>
                </div>
                <div className={style.hr}/>
                <div className={style.property_title}>
                    コマンド
                </div>
                <div className={style.property_basic_operators}>
                    {operators}
                </div>
                <div className={style.hr}/>
                <div className={style.property_title}>
                  作成したフロー
                </div>
                <div>
                  <DropDownList list={[{name:"サブフロー1",value:1,object:{}}]}/>
                </div>
        </Inspector>
    }

}

export default DataSourceInspector