import * as React from 'react'

import CommonListHeader from './CommonListRow/CommonListHeader/index'
import CommonListRow from './CommonListRow/index';
import defaultStyle from './ListStyle/default.scss'

type Props<Data> = {
  lists: Data[]
  selected: Data[]

  getHeaders(): any[]
  getColumns(data: Data, index: number): any[] | null // nullの場合、該当行を表示しない

  onClickData(e: React.MouseEvent<HTMLInputElement>, data: Data, index: number): void

  customStyle?: any
}

type State = {
  selectedIndexes: number[]
}

export default class List<Data> extends React.Component<Props<Data>, State>{

  constructor(props: Props<Data>) {
    super(props)

    this.state = this.initialState()
  }

  initialState(): State {
    return {
      selectedIndexes: []
    }
  }

  renderHeaders(style: any) {
    const { getHeaders } = this.props
    const headers:any[] = getHeaders()
    return <CommonListHeader headers={headers} style={style} />
  }

  renderRows(lists: Data[] = [], selected: Data[] = [], style: any) {
    const { onClickData, getColumns } = this.props
    let rows: any[] = []
    lists.forEach((data: Data, index: number) => {
      const isSelected: boolean = selected.includes(data)
      const columns: any[] | null = getColumns(data, index)
      if (columns) {
        const row = <React.Fragment key={index}>
        <CommonListRow<Data>
          index={index}
          isSelected={isSelected}
          columns={columns}
          data={data}
          onClick={(e) => onClickData(e,data,index)}
          style={style}
        />
      </React.Fragment>

      rows.push(row)
      }
    })
    return rows
  }

  render() {
    const { lists, customStyle, selected } = this.props

    const style = (customStyle) ? customStyle : defaultStyle

    return <React.Fragment>
      <div className={style.list}>
        {this.renderHeaders(style)}
        {this.renderRows(lists, selected, style)}
      </div>
    </React.Fragment>
  }
}