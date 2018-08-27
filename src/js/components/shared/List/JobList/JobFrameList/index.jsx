//@flow
import * as React from 'react'
import classnames from 'classnames'
import style from '../style.scss'
import Constants from '../../../../../constants'
import ModalUtil from '../../../../../utils/ModalUtil'
import DataTable from '../../../DataTable'
import moment from 'moment'
import HttpUtil from '../../../../../utils/HttpUtil'
import DataPreview from '../../../DataPreview'
import ChartUtil from '../../../../../utils/ChartUtil'

type JobFrameProps = {
  type:string;
  uuid:string;
  job: {};
}

type JobFrameState = {
  flowNames: {}
}

export default class JobFrameList extends React.Component<JobFrameProps,JobFrameState> {

  constructor (props:JobFrameProps) {
    super(props)
    this.state = {
      flowNames: {}
    }
  }

  getFlowName(uuid:string){
    let {flowNames} = this.state

    let flowName = flowNames[uuid]
    if(flowName) return flowName
    HttpUtil.get('flows/' + uuid + "?navigation=off").then((response) => {
      const json = response.data
      const label = json.data.label
      flowNames[uuid] = label
      this.setState({flowNames:flowNames})
    })
  }

  onClickName(e:Event,uuid:string,name:string){
    HttpUtil.get("frames/"+uuid).then((response)=>{
      const json = response.data
      let contentGraph = <DataPreview key={uuid} json={json} />
      let contentTable = <div className="table-responsive">
        <DataTable json={ChartUtil.jsonToChart(json.data.contents)}></DataTable>
      </div>
      ModalUtil.emitModal({
        id: Constants.preview.DATASOURCE,
        visible: true,
        contents: [{title:"データの表示",content:contentTable},{title:"グラフの表示",content:contentGraph}],
        title: name,
      })
    })
    e.preventDefault()
  }

  render () {
    const {uuid,job} = this.props

    const dataframe = Object.keys(job.data).map(d=>{
      return <div>
        <i className={classnames('material-icons', [style.icon])}>description</i>
        <a href={"#"} onClick={(e)=>this.onClickName(e,job.data[d].uuid,d)}>{d}</a>
        {/*<div className={style.uuid}><small>{job.data[d].uuid}</small></div>*/}
      </div>
    })

    let executedAt = moment(job.executedAt).format(Constants.format.dateTime)

    return <div className={style.job_list}>
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
