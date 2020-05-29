import React from 'react'
import defaultStyle from './style.scss'

type Props = {
  hasIcon?: boolean
  headers: string[];
  customStyle?: string;
}

export default class FlowListHeader extends React.Component<Props> {

  constructor(props: Props) {
    super(props)
  }

  renderHeaders(headers: string[]) {
    let result: any = []

    headers.forEach((header, index) => {
      let renderedHeader = <div key={index + header}>{header}</div>
      result.push(renderedHeader)
    })

    return result
  }

  render() {
    const { hasIcon, headers, customStyle } = this.props

    let style = (customStyle) ? customStyle : defaultStyle

    return <div className={style.listHeader}>
       <div className={(hasIcon) ? style.icon : undefined}></div>
      <div className={style.columns}>
        {this.renderHeaders(headers)}
      </div>
    </div>
  }

}