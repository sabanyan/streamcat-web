// @flow
import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import JobFrameList from './JobFrameList'

type JobProps = {
  // executedAt: string;
  // executor: {name:string};
  // inputs:{};
  // params:{};
  // flow:{};
  // uuid:{};
  // data:{};
  // errors:{};
  type:string;
  uuid:string;
}

type Props = {
  icon: string;
  job: JobProps;
  href: string;
  children: React.Node;
}

export default class JobList extends React.Component<Props> {

  constructor (props:Props) {
    super(props)
  }

  render () {
    const {icon, children, href, job} = this.props
    const {uuid} = job

    const jobFrameList = Object.keys(job.data).map((data_key)=>{
      const dataframe = job.data[data_key]
      return <JobFrameList {...dataframe} job={job}/>
    })
    return jobFrameList
  }
}
