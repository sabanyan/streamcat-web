//@flow
import React from 'react'
import style from './style.scss'
import DataTableInspector from '../Inspector/DataTableInspector'

type Props = {
  json: {
    datasets: [];
    labels: [];
    success: boolean;
    errormessage: string;
    errorcode: number;
    columns: string[]
  };
  title: string;
}

export default class DataTable extends React.Component<Props> {
  render () {

    let {json,title,uuid,selected_data_source_detail} = this.props
    let tr
    let body_trs
    let tds
    let head_ths

    if (!json) {
      return null
    }

    head_ths = []

    body_trs = []
    tds = []
    /**
     * ヘッダー行の設定
     */
    json.labels.forEach((label:string, index:number) => {
      tds.push(<th key={'th_' + index}>{label}</th>)
    })
    body_trs.push(<tr key={'tr_th'}>{tds}</tr>)

    /**
     * データ行の最大行数の取得
     * @type {number}
     */
    let max_row = 0
    json.datasets.forEach((dataset) => {
      max_row = Math.max(max_row, dataset.data.length)
    })

    /**
     * データ行の設定
     */
    for (let row:number = 0; row < max_row; row++) {
      tds = []
      json.labels.map(function (label:string, col:number) {
        if (json.datasets[col].label === label) {
          tds.push(<td key={'td_' + col}>{json.datasets[col].data[row]}</td>)
        }
      })
      body_trs.push(<tr key={'tr_' + row}>{tds}</tr>)
    }
    return <div className={style.data_table_container} style={{height:window.innerHeight}}>
      <div className={style.data_table_body} style={{height:window.innerHeight}}>
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
      <div className={style.data_table_property} style={{height:window.innerHeight}}>
        <DataTableInspector title={title}　uuid={uuid} selected_data_source_detail={selected_data_source_detail} />
      </div>
    </div>
  }
}