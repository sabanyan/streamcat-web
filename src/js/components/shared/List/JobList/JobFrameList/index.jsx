//@flow
import * as React from 'react'
import classnames from 'classnames'
import style from '../style.scss'
import Constants from 'Constants/index'
import ModalUtil from 'Utils/ModalUtil'
import SortUtil from 'Utils/SortUtil'
import moment from 'moment'
import APIUtil from 'Utils/APIUtil'
import Visualizer from 'Shared/Visualizer'

type JobFrameProps = {
  type: string;
  uuid: string;
  job: {};
  onClickJob: Function;
  selected: boolean;
}

type JobFrameState = {
  flowNames: {}
}

export default class JobFrameList extends React.Component<JobFrameProps, JobFrameState> {

  constructor (props: JobFrameProps) {
    super(props)
    this.state = {
      flowNames: {}
    }
  }

  getFlowName (uuid: string) {
    let {flowNames} = this.state

    let flowName = flowNames[uuid]
    if (flowName) return flowName
    APIUtil.get('flows/' + uuid + '?navigation=off').then((response) => {
      const json = response.data
      const label = json.data.label
      flowNames[uuid] = label
      this.setState({flowNames: flowNames})
    })
  }

  onClick (e: Event) {
    const {job, onClickJob} = this.props
    if (onClickJob) {
      onClickJob(e, job)
    }
  }

  onClickName (e: Event, uuid: string, name: string) {
//    //TODO 将来的にはページングなどの対応が必要
//    APIUtil.get("frames/"+uuid + "?offset=0&limit=1000").then((response)=>{
//      const json = response.data
//      let contentGraph = <DataPreview key={uuid} json={json} title={name} uuid={uuid} />
//      let contentTable = <div className="table-responsive">
//        <DataTable json={ChartUtil.jsonToChart(json.data.contents)} title={name} uuid={uuid} selected_data_source_detail={response.data.data}></DataTable>
//      </div>
//      ModalUtil.emitModal({
//        id: Constants.preview.DATASOURCE,
//        visible: true,
//        contents: [{title:"データの表示",content:contentTable},{title:"グラフの表示",content:contentGraph}],
//        title: name,
//      })
//    })

    const getFrameHeaderURL = 'frames/' + uuid
    APIUtil.get(getFrameHeaderURL + '?header_only=1&offset=0&limit=1').then((response) => {
      const headers = response.data.data
      let visualizers = window.visualizers
      visualizers = SortUtil.getSortedContents(visualizers)
      let contents = []
      for (const v of visualizers) {
        const content = <Visualizer key={v.order + uuid} frame_uuid={uuid} visualize={v} params={{}}
                                    headers={headers} />
        contents.push({title: v.label, content: content, parentProps: this.props})
      }

      ModalUtil.emitModal({
        id: Constants.preview.DATASOURCE,
        visible: true,
        contents: contents,
        title: name
      })
      this.setState({
        loading: false
      })
    })

    e.preventDefault()
  }

  render () {
    const {uuid, job, selected} = this.props

    const dataframe = Object.keys(job.data).map(d => {
      return <div>
        <i className={classnames('material-icons', [style.icon])}>description</i>
        <a href={'#'} onClick={(e) => this.onClickName(e, job.data[d].uuid, d)}>{d}</a>
        {/*<div className={style.uuid}><small>{job.data[d].uuid}</small></div>*/}
      </div>
    })

    let executedAt = moment(job.executedAt).format(Constants.format.dateTime)

    return <div className={classnames(style.job_list, {[style.selected]: selected})} onClick={(e) => this.onClick(e)}>
      <div className={style.executed_at}>{executedAt}</div>
      <div className={style.name}>
        {dataframe}
      </div>
      <div className={style.flow_name}>{this.getFlowName(job.flow.uuid)}</div>
      <div className={style.executor_name}>{job.executor.name}</div>
      <div className={style.status}>{job.state}</div>
    </div>
  }
}
