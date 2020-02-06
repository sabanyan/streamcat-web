import React from 'react'
import defaultStyle from './style.scss'

type Props = {
  headers: string[];
  customStyle?:string;
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
    const {headers, customStyle} = this.props

    let style = (customStyle) ? customStyle : defaultStyle

    return <div className={style.listHeader}>
      {this.renderHeaders(headers)}
    </div>
  }

}