import React from 'react'

export default class DataTable extends React.Component {
  render () {

    let {json} = this.props
    let tr
    let body_trs
    let tds
    let head_ths

    if (!json) return null

    if(json.data && !Object.keys(json.data).length)return <div>
      表示できるデータがありません
    </div>

    if (!json.success) {
      return <div>
        <div className="mb-16px">サーバでエラーが発生したため結果を表示することができませんでした</div>
        <strong>エラー({json.errorcode})</strong>
        <div>
          {json.errormessage}
        </div>
      </div>
    }

    head_ths = []

    if(json.columns){
      /**
       * ヘッダー行の設定
       */
      json.columns.map((value, index) => {
        head_ths.push(<th key={index}>{value}</th>)
      });

      /**
       * データ行の設定
       */
      body_trs = []
      json.data.map((data_row, index) => {
        tds = []
        data_row.map(function(data,index){
          tds.push(<td key={index}>{data}</td>)
        })
        body_trs.push(<tr key={index}>{tds}</tr>)
      })

    }else{
      const first_key = Object.keys(json.data)[0]
      let data_cnt = json.data[first_key].length
      /**
       * ヘッダー行の設定
       */
      Object.keys(json.data).map((key, index) => {
        head_ths.push(<th key={index}>{key}</th>)
      });

      /**
       * データ行の設定
       */
      body_trs = [];
      for(let i = 0;i < data_cnt;i++){
        tds = []
        Object.keys(json.data).map((key, index) => {
          tds.push(<td key={index}>{json.data[key][i]}</td>)
        })
        body_trs.push(<tr key={i}>{tds}</tr>)
      }
    }

    return <table className="kskp-data-table table-bordered table table-striped">
      <thead>
      <tr className="table-active">
        {head_ths}
      </tr>
      </thead>
      <tbody>
      {body_trs}
      </tbody>
    </table>
  }
}