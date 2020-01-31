import * as React from 'react'
import style from './style.scss'

type Props = {
  logs: string[]
}

type State = {
}

export default class LogBox extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)

    this.state = {
      logs: []
    }
  }

  render() {
    const { logs } = this.props

    return <React.Fragment>
      <textarea value={logs.join("")}
        className={style.logBox} cols={60} rows={8} readOnly>
      </textarea>
    </React.Fragment>
  }
}