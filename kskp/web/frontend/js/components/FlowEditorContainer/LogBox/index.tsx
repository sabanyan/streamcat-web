import * as React from 'react'
import style from './style.scss'
import { IconButton } from 'Components/shared/Input'

type Props = {
  logs: string[]
  width: number // flow_editorのwidthより決められる
}

type State = {
  height: number,
  isFold: boolean
}

const LOGBOX_HEIGHT = 128 // px
export default class LogBox extends React.Component<Props, State> {
  textLog

  constructor(props: Props) {
    super(props)
    this.textLog = React.createRef()

    this.state = {
      height: LOGBOX_HEIGHT,
      isFold: false
    }
  }

  componentDidUpdate() {

    // textArea
    if (this.textLog.current) {
      this.textLog.current.scrollTop = this.textLog.current.scrollHeightß
    }
  }

  onClickUnFold() {
    this.setState({
      height: LOGBOX_HEIGHT,
      isFold: false
    })
  }

  onClickFold() {
    this.setState({
      height: LOGBOX_HEIGHT,
      isFold: true
    })
  }

  renderTextArea() {
    const { width, logs } = this.props
    const { isFold, height } = this.state

    let textArea: any = null
    if (isFold === false) {
      textArea = <textarea
        className={style.textArea}
        value={logs.join("")}
        style={{ width: width, height: height }}
        ref={this.textLog}
        cols={60} rows={8} readOnly>
      </textarea>
    }
    return <React.Fragment>
      {textArea}
    </React.Fragment>
  }

  renderButtonGroup() {
    const { isFold } = this.state
    let result

    if (isFold) {
      result = <IconButton icon={'expand_less'} onClick={() => this.onClickUnFold()}></IconButton>
    } else {
      result = <IconButton icon={'expand_more'} onClick={() => this.onClickFold()}></IconButton>
    }

    return result
  }

  render() {
    const { logs, width } = this.props
    const height = this.state.height

    return <div className={style.logBox} style={{ width: width }}>
      <div className={style.buttonGroup}>
        {this.renderButtonGroup()}
      </div>
      {this.renderTextArea()}
    </div>
  }
}