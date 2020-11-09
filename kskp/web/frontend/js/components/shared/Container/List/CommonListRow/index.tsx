import * as React from 'react'
import classnames from 'classnames'

type Props<Data> = {
  index: number
  isSelected: Boolean
  columns: any[]
  // data
  data: Data
  onClick(e, data, index): void
  //style
  style: any
}

export default class CommonListRow<Data> extends React.Component<Props<Data>> {

  constructor(props: Props<Data>) {
    super(props)
  }

  renderColumns(columns: any[], style: any) {

    let result: any = []
    columns.forEach((column, index) => {
      let renderedHeader = <div className={style.columns} key={index}>{column}</div>
      result.push(renderedHeader)
    })

    return result
  }

  render() {
    const { isSelected, style, columns, onClick, data, index } = this.props

    return <React.Fragment>
      <div className={classnames(style.rows, { [style.selected]: isSelected })}
          onClick={(e) => onClick(e, data, index)}>
        {this.renderColumns(columns, style)}
      </div>
    </React.Fragment>
  }
}