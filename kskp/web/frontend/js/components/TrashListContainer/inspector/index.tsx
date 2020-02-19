import * as React from 'react'

import style from './style.scss'

import { BaseInspector, Resizer } from 'Shared/Inspector'
import { Button } from 'Shared/Input'
import { LibraryChild } from 'Model/index'


type Props = {
  data?: LibraryChild
  customStyle?: any

  onClickRecovery: Function
  onClickMove: Function
}

type State = {

}

export default class TrashInspector extends React.Component<Props, State> {
  display = {
    label: '名称',
    encoding: '文字コード',
    newline: '改行コード',
    creator: '作成者',
    createdAt: '作成日時',
  }


  constructor(props: Props) {
    super(props)
  }

  renderButtons(data) {
    const {onClickRecovery, onClickMove} = this.props

    let recovery, move
    if (data) {
      recovery = <Button onClick={(e) => onClickRecovery(e, data)} icon={'undo'}>戻す</Button> 
      move =  <Button onClick={(e) => onClickMove(e,data)} icon={'arrow_right_alt'}>移動する</Button>
    }

    return <React.Fragment>
      {recovery}
      {move}
    </React.Fragment>
  }

  renderDetail() {
    const { data } = this.props
    let result: any = []
    if (!data) return result

    // ラベルがあれば、表示する
    let label
    if (data.label) {
      label = <React.Fragment key={data.label}>
        <div><label>{this.display.label}</label></div>
        <div className={"mb-8px"}>{data.label}</div>
      </React.Fragment>

      result.push(label)
    }

    // 文字コードがあれば、表示する
    let encoding
    if (data.encoding) {
      encoding = <React.Fragment key={data.encoding}>
        <div><label>{this.display.encoding}</label></div>
        <div className={"mb-8px"}>{data.encoding}</div>
      </React.Fragment>

      result.push(encoding)
    }

    // 改行コードがあれば、表示する
    let newline
    if (data.newline) {
      newline = <React.Fragment key={data.newline}>
        <div><label>{this.display.newline}</label></div>
        <div className={"mb-8px"}>{data.newline}</div>
      </React.Fragment>

      result.push(newline)
    }

    // 作成者があれば、表示する
    let creator
    if (data.creator) {
      creator = <React.Fragment key={data.creator}>
        <div><label>{this.display.creator}</label></div>
        <div className={"mb-8px"}>{data.creator}</div>
      </React.Fragment>

      result.push(creator)
    }

    // 作成日時があれば、表示する
    let createdAt
    if (data.createdAt) {
      createdAt = <React.Fragment key={data.createdAt}>
        <div><label>{this.display.createdAt}</label></div>
        <div className={"mb-8px"}>{data.createdAt}</div>
      </React.Fragment>

      result.push(createdAt)
    }


    return <React.Fragment>
      {result}
    </React.Fragment>
  }

  render() {
    const { data, customStyle } = this.props

    const className = (customStyle) ? customStyle : style

    return <React.Fragment>
      <BaseInspector>
        <div className={style.inspector}>
          <div className={style.actions}>
            {this.renderButtons(data)}
          </div>
          <div className={style.detail}>
            {this.renderDetail()}
          </div>
        </div>
      </BaseInspector>
    </React.Fragment>
  }
}