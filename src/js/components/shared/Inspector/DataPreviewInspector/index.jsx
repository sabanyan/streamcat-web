//@flow
import React from 'react'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../DataTable/index'
import Inspector from '../BaseInspector/index'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import style from '../../DataPreview/style.scss'
import Button from '../../Button/index'
import DownloadButton from '../../Button/DownloadButton/index'
import BaseInspector from '../BaseInspector'

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
    const content = <div>
        <div className={style.actions}>
          <DownloadButton download="image.png" href={this.props.image_url} onClick={(e)=>this.onClickSave(e)}>チャートグラフの保存</DownloadButton>
        </div>
        <div className="kskp-form">
          <div className="mb-16px">
            <label>グラフの種類</label>
          </div>
          <div>
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
        </div>
      </div>

    return <BaseInspector header={""} title={"プレビュー"} {...this.props}>
      {content}
    </BaseInspector>
  }

}

export default DataPreviewInspector