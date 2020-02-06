import React from 'react'
import defaultStyle from './style.scss'

type Props = {
  headers: string[];
  style:StyleSheet;
}

export default class FlowListHeader extends React.Component<Props> {

  constructor (props:Props) {
    super(props)
  }

  renderHeaders(headers:string[]) {
    let result:any = []
    headers.forEach((header, index) => {
      let renderedHeader = <div key={index + header}>{header}</div>
      result.push(renderedHeader)
    })

    return result
  }

  render () {
    const {headers, style} = this.props

    let customStyle = (style) ? style : defaultStyle

    return <div className={customStyle.listHeader}>
      {this.renderHeaders(headers)}
    </div>
  }

}