// @flow
import * as React from 'react'
import classnames from 'classnames'

type JobFrameProps = {
  type:string;
  uuid:string;
}

export default class JobFrameList extends React.Component<JobFrameProps> {

  constructor (props:JobFrameProps) {
    super(props)
  }

  render () {
    const {uuid} = this.props
    return <div>
      {uuid}
    </div>
  }
}
