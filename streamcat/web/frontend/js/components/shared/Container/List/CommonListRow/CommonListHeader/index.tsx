import React from 'react'

type Props = {
  headers: any[];
  style: any;
}

export default class CommonListHeader extends React.Component<Props> {

  constructor(props: Props) {
    super(props)
  }

  renderHeaders(headers: any[], style: any) {
    let result: any = []

    headers.forEach((header, index) => {
      let renderedHeader = <div className={style.columns} key={index + header}>{header}</div>
      result.push(renderedHeader)
    })

    return result
  }

  render() {
    const { headers, style } = this.props

    return <div className={style.headers}>
      {this.renderHeaders(headers, style)}
    </div>
  }
}