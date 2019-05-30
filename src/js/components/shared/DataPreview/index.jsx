//@flow
import React from 'react'
import { Bar, Bubble, Doughnut, HorizontalBar, Line, Pie, Polar, Radar, Scatter, } from 'react-chartjs-2'
import ChartUtil from '../../../utils/ChartUtil'
import Constants from '../../../constants/index'
import style from './style.scss'
import DataPreviewInspector from '../Inspector/DataPreviewInspector'

type State = {
  json?: any,//TODO resetting
  type: string,
  chart_instance?: any,
  type: string
}

type Props = {}

export default class DataPreview extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {json: props.json, type: Constants.chart.bar}
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
    const {title} = this.props

    let json = this.state.json

    if (!json) {
      return null
    }

    let data = ChartUtil.jsonToChart(json.data.contents)
    let type = this.state.type
    let chart
    switch (type) {
      case Constants.chart.bar:
        chart = <Bar data={data} ref="chart" height={100}></Bar>
        break
      case Constants.chart.bubble:
        chart =
          <Bubble data={data} ref="chart" height={100}></Bubble>
        break
      case Constants.chart.doughnut:
        chart =
          <Doughnut data={data} ref="chart" height={100}></Doughnut>
        break
      case Constants.chart.horizontalBar:
        chart = <HorizontalBar data={data} ref="chart" height={100}></HorizontalBar>
        break
      case Constants.chart.line:
        chart = <Line data={data} ref="chart" height={100}></Line>
        break
      case Constants.chart.pie:
        chart = <Pie data={data} ref="chart" height={100}></Pie>
        break
      case Constants.chart.polar:
        chart = <Polar data={data} ref="chart" height={100}></Polar>
        break
      case Constants.chart.radar:
        chart = <Radar data={data} ref="chart" height={100}></Radar>
        break
      case Constants.chart.scatter:
        chart =
          <Scatter data={data} ref="chart" height={100}></Scatter>
        break
    }

    return <div className={style.data_preview_container} style={{height:window.innerHeight}}>
      <div className={style.data_preview_body} style={{height:window.innerHeight}}>
          {chart}
      </div>
      <div className={style.data_preview_property} style={{height:window.innerHeight}}>
        <DataPreviewInspector chart_instance={this.state.chart_instance} onChange={(type)=>this.onChangePreviewInspector(type)} title={title}/>
      </div>
    </div>
  }
}