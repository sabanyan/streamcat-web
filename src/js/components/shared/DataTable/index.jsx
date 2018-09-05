//@flow
import React from 'react'
import style from './style.scss'
import DataTableInspector from '../Inspector/DataTableInspector'

type Props = {
  json: {
    data: any;//TODO resetting
    success: boolean;
    errormessage: string;
    errorcode: number;
    columns: string[]
  }
}

export default class DataTable extends React.Component<Props> {
  render () {

    let {json} = this.props
    let tr
    let body_trs
    let tds
    let head_ths

    if (!json) {
      return null
    }

    // if (json.data && !Object.keys(json.data).length) {
    //   return <div>
    //     表示できるデータがありません
    //   </div>
    // }
    //
    // if (json.errorcode) {
    //   return <div>
    //     <div className="mb-16px">サーバでエラーが発生したため結果を表示することができませんでした</div>
    //     <strong>エラー({json.errorcode})</strong>
    //     <div>
    //       {json.errormessage}
    //     </div>
    //   </div>
    // }

    head_ths = []

    // if (json.labels) {
      // json.labels.map((value, index) => {
      //   head_ths.push(<th key={index}>{value}</th>)
      // })

      /**
       * データ行の設定
       */
      body_trs = []
      json.datasets.map((dataset, index) => {
        tds = []
        /**
         * ヘッダー行の設定
         */
        tds.push(<th key={"th_"+index}>{json.labels[index]}</th>)
        dataset.data.map(function (data, index) {
          tds.push(<td key={"td_"+index}>{data}</td>)
        })
        body_trs.push(<tr key={"tr_"+index}>{tds}</tr>)
      })

    // }
    // else {
    //   const first_key = Object.keys(json.data)[0]
    //   let data_cnt = json.data[first_key].length
    //   /**
    //    * ヘッダー行の設定
    //    */
    //   Object.keys(json.data).map((key, index) => {
    //     head_ths.push(<th key={index}>{key}</th>)
    //   })
    //
    //   /**
    //    * データ行の設定
    //    */
    //   body_trs = []
    //   for (let i = 0; i < data_cnt; i++) {
    //     tds = []
    //     Object.keys(json.data).map((key, index) => {
    //       tds.push(<td key={index}>{json.data[key][i]}</td>)
    //     })
    //     body_trs.push(<tr key={i}>{tds}</tr>)
    //   }
    // }

    return <div className={style.data_table_container}>
      <div className={style.data_table_body}>
        <table
          className="kskp-data-table table-bordered table table-striped">
          <thead>
          <tr className="table-active">
            {head_ths}
          </tr>
          </thead>
          <tbody>
          {body_trs}
          </tbody>
        </table>
      </div>
      <div className={style.data_table_property}>
        <DataTableInspector/>
      </div>
    </div>
  }
}