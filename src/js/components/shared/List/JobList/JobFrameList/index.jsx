// @flow
import * as React from 'react'
import classnames from 'classnames'
import style from '../style.scss'
import Constants from '../../../../../constants'
import ModalUtil from '../../../../../utils/ModalUtil'
import DataTable from '../../../DataTable'
import moment from 'moment'
import HttpUtil from '../../../../../utils/HttpUtil'
import DataPreview from '../../../DataPreview'

type JobFrameProps = {
  type:string;
  uuid:string;
  job: {};
}

export default class JobFrameList extends React.Component<JobFrameProps> {

  constructor (props:JobFrameProps) {
    super(props)
  }
  onClickName(e:Event,uuid){
    HttpUtil.get("frames/"+uuid).then((response)=>{
      let content = <DataPreview key={uuid} json={response.data.data} />
      ModalUtil.emitModal({
        id: Constants.preview.DATASOURCE,
        visible: true,
        content: content,
        title: uuid,
      })
    })
    e.preventDefault()
  }

  render () {
    const {uuid,job} = this.props

    const dataframe = Object.keys(job.data).map(d=>{
      return <div>
        <a href={"#"} onClick={(e)=>this.onClickName(e,job.data[d].uuid)}>{d}</a>
        <div className={style.uuid}><small>{job.data[d].uuid}</small></div>
      </div>
    })

    return <div className={style.job_list}>
      <div className={style.name}>
        <i className={classnames('material-icons', [style.icon])}>description</i>
        {dataframe}
      </div>
      <div className={style.executor_name}>{job.executor.name}</div>
      <div className={style.executed_at}>{moment(job.executedAt).format(Constants.format.dateTime)}</div>
      <div className={style.status}>{job.state}</div>
    </div>
  }
}
