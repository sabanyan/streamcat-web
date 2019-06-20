//@flow
import * as React from 'react'
import {JobFrameList} from 'Shared/List'

type JobProps = {
  // executedAt: string;
  // executor: {name:string};
  // inputs:{};
  // params:{};
  // flow:{};
  // uuid:{};
  // data:{};
  // errors:{};
  type: string;
  uuid: string;
}

type Props = {
  icon: string;
  job: JobProps;
  href: string;
  children: React.Node;
  onClickJob: Function;
  selected: boolean;
}

export default class JobList extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  render () {
    const {icon, children, href, job, onClickJob, selected} = this.props
    const {uuid} = job

    return <JobFrameList uuid={uuid} job={job} onClickJob={onClickJob} selected={selected} />
  }
}
