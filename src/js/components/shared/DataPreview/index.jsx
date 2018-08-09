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
import DownloadButton from '../Button/DownloadButton'
import DataPreviewInspector from './DataPreviewInspector'

type State = {
  json?: any,//TODO resetting
  type: string,
  image_url?: string,
  chart_instance?: any,
  type: string
}

type Props = {}

export default class DataPreview extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {json: props.json, type: Constants.chart.bar, image_url: null}
  }

  componentWillMount () {
    const self = this

    Chart.pluginService.register({
      afterDraw: function (chart, easing) {
        self.setState({chart_instance: chart})
      },
    })

  }

  onChangePreviewInspector(type){
    this.setState({type:type})
  }

  render () {
    console.log("render")

    let json = this.state.json

    if (!json) {
      return null
    }
    console.log(json)

    let data = ChartUtil.jsonToChart(json.data.contents)
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
        <div className="kskp-visualization-body">
          <div>
            <div className="table-responsive">
              <DataTable json={data}></DataTable>
            </div>
            <div>
              {chart}
            </div>
          </div>
        </div>
      </div>

      <DataPreviewInspector image_url={this.state.image_url} onChange={(type)=>this.onChangePreviewInspector(type)}/>

    </div>
  }
}