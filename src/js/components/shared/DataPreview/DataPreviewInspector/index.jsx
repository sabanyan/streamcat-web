//@flow
import React from 'react'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../DataTable/index'
import Inspector from '../../../FlowEditorContainer/Inspector/Inspector/index'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import style from '../../../FlowEditorContainer/Inspector/style.scss'
import Button from '../../Button/index'
import DownloadButton from '../../Button/DownloadButton'

class DataPreviewInspector extends React.Component<FlowEditorProps> {


  onChangeChart (e:Event) {
    const type = e.target.value
    this.setState({type: type})
    this.props.onChange(type)
  }

  onClickSave(e:Event){
    let chart_instance = this.state.chart_instance
    let url_base64 = chart_instance.toBase64Image();
    this.setState({image_url:url_base64})
  }

  render () {
    return  <div className={style.visualization_property}>
      <div className={style.visualization_property_body}>
        <div className="kskp-form">
          <div className="mb-16px">
            <label>グラフの種類</label>
            <select className="form-control" onChange={(e) => this.onChangeChart(e)}
                    defaultValue={Constants.chart.bar}>
              <option value={Constants.chart.bar}>縦棒グラフ</option>
              <option value={Constants.chart.horizontalBar}>横棒グラフ</option>
              {/*<option value={Constants.chart.doughnut}>ドーナツチャート</option>*/}
              {/*<option value={Constants.chart.line}>折れ線グラフ</option>*/}
              <option value={Constants.chart.pie}>パイチャート</option>
              {/*<option value={Constants.chart.polar}>ポーラチャート</option>*/}
              <option value={Constants.chart.radar}>レーダーチャート</option>
              {/*<option value={Constants.chart.bubble}>バブルチャート</option>*/}
              <option value={Constants.chart.scatter}>散布図</option>
            </select>
          </div>
          <div>
            <DownloadButton download="image.png" href={this.props.image_url} onClick={(e)=>this.onClickSave(e)}>チャートグラフの保存</DownloadButton>
          </div>
        </div>
      </div>
    </div>
  }

}

export default DataPreviewInspector