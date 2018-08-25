//@flow
import React from 'react'
import DataTable from '../../shared/DataTable'
import {
  Doughnut,
  Pie,
  Line,
  Bar,
  HorizontalBar,
  Radar,
  Polar,
  Bubble,
  Scatter,
} from 'react-chartjs-2'
import ChartUtil from '../../../utils/ChartUtil'
import Constants from '../../../constants/index'

type State = {
  json?: any,//TODO resetting
  type: string,
  image_url?: string,
  chart_instance?: any,
  type: string
}

type Props = {}

export default class Visualization extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {json: null, type: Constants.chart.bar, image_url: null}
  }

  componentWillMount () {
    const self = this

    let option = {
      method: 'GET',
      mode: 'same-origin',
      credentials: 'include',
      redirect: 'follow',
    }

    fetch('http://' + Constants.api.host + '/api/v0-1/flows/' +
      inject_flow_uuid + '/execute', option).then(function (response) {
      if (response.ok) {
        return response.json()
      }
      else {
        alert('サーバでエラーが発生しました')
      }
    }).then(function (json) {
      self.setState({json: json})
    }).catch((err) => {
      console.log(err)
      alert('クライアントでエラーが発生しました')
    })

    Chart.pluginService.register({
      afterDraw: function (chart, easing) {
        self.setState({chart_instance: chart})
      },
    })

  }

  onChangeChart (e: Event) {
    this.setState({type: e.target.value})
  }

  onClickSave (e: Event) {
    let chart_instance = this.state.chart_instance
    let url_base64 = chart_instance.toBase64Image()
    this.setState({image_url: url_base64})
  }

  render () {

    let json = this.state.json

    if (!json) {
      return null
    }

    let data = ChartUtil.jsonToChart(json)

    let type = this.state.type
    let chart
    switch (type) {
      case Constants.chart.bar:
        chart = <Bar data={data} ref="chart" height={100} width={100}></Bar>
        break
      case Constants.chart.bubble:
        chart =
          <Bubble data={data} ref="chart" height={100} width={100}></Bubble>
        break
      case Constants.chart.doughnut:
        chart =
          <Doughnut data={data} ref="chart" height={100} width={100}></Doughnut>
        break
      case Constants.chart.horizontalBar:
        chart = <HorizontalBar data={data} ref="chart" height={100}
                               width={100}></HorizontalBar>
        break
      case Constants.chart.line:
        chart = <Line data={data} ref="chart" height={100} width={100}></Line>
        break
      case Constants.chart.pie:
        chart = <Pie data={data} ref="chart" height={100} width={100}></Pie>
        break
      case Constants.chart.polar:
        chart = <Polar data={data} ref="chart" height={100} width={100}></Polar>
        break
      case Constants.chart.radar:
        chart = <Radar data={data} ref="chart" height={100} width={100}></Radar>
        break
      case Constants.chart.scatter:
        chart =
          <Scatter data={data} ref="chart" height={100} width={100}></Scatter>
        break
    }

    return <div className="kskp-visualization">
      <div className="kskp-visualization-container">
        <div className="kskp-visualization-header">
          <div className="row">
            <div className="col-sm-4">
              {/*<i className="icon material-icons">arrow_back</i>*/}
              {/*<span className="title">*/}
              {/*sorted-test-data*/}
              {/*</span>*/}
            </div>
            <div className="col-sm-8 text-right">
              <a download="image.png" href={this.state.image_url}
                 className="btn btn-secondary text-12px"
                 onClick={(e) => this.onClickSave(e)}>チャートグラフの保存</a>
            </div>
          </div>
        </div>
        <div className="kskp-visualization-body">
          <div className="row">
            <div className="col-sm-6">
              <DataTable json={json}></DataTable>
            </div>
            <div className="col-sm-6">
              {chart}
            </div>
          </div>
        </div>
      </div>
      <div className="kskp-visualization-property">
        <div className="kskp-visualization-property-body">
          <div className="kskp-form">
            <div className="mb-16px">
              <label>グラフの種類</label>
              <select className="form-control"
                      onChange={(e) => this.onChangeChart(e)}
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
      </div>
    </div>
  }
}