import * as React from 'react'
import classnames from 'classnames'
import defaultStyle from './style.scss'
import { database } from './ListIcons/index'

type Props = {
  isSelected: Boolean
  icon?: string

  // data
  headers: string[]
  hrefs?: string[] // clickされた時、飛ぶURL（headersのitemと紐付く） 
  data: any

  //style
  customStyle?: any

  onClick: Function
}

export default class CommonListRow extends React.Component<Props> {

  constructor(props: Props) {
    super(props)
  }

  onClick(e) {
    const { data, onClick } = this.props
    if (onClick) onClick(e, data)
  }

  renderIcon(icon: string) {
    let result
    switch (icon) {
      case 'kskp_database': result = database
        break;

      default: result = <i className={classnames('material-icons')}>{icon}</i>
        break;
    }

    return result
  }

  renderColumn() {
    const { data, headers, hrefs } = this.props

    let hrefsArray = new Array(headers.length)
    if (hrefs) {
      hrefs.forEach((h, index) => {
        hrefsArray[index] = h
      })
    }

    let result: any = []
    headers.forEach((header, index) => {
      // 該当columnに飛ぶ先が設定されてる場合
      let renderedHeader = <div key={index + header}>{data[header]}</div>
      if (hrefsArray[index]) {
        renderedHeader = <div key={index + header}>
          <a href={hrefsArray[index]}>
            <span>{data[header]}</span>
          </a>
        </div>
        // 該当columnに飛ぶ先が設定されいない場合
      } else {
        renderedHeader = <div key={index + header}>
          {data[header]}
        </div>
      }

      result.push(renderedHeader)
    })

    return result
  }

  render() {
    const { icon, hrefs, data, isSelected, customStyle } = this.props

    let style = (customStyle) ? customStyle : defaultStyle

    return <div className={classnames(style.listRow, { [style.selected]: isSelected })} onClick={(e) => this.onClick(e)}>
      <div className={style.icon}>
        {icon ? this.renderIcon(icon) : null}
      </div>
      <div className={style.columns}>
        {this.renderColumn()}
      </div>
      <div className={style.actions}>
      </div>
    </div>
  }
}