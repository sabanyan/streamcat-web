// @flow
import React from 'react'
import DataSourceModel from '../../../../model/DataSourceModel'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../../shared/DataTable/index'
import OperatorModel from '../../../../model/OperatorModel'
import Inspector from '../Inspector'
import type { FlowEditorProps } from '../../index'
import style from '../style.scss'
import Button from '../../../shared/Button'

class MultiInspector extends React.Component<FlowEditorProps> {
  onClickDelete (e: Event) {
    if (window.confirm('これらコマンドを削除しますか？')) {
      let {selected_step_ids} = this.props
      this.props.deleteSteps(selected_step_ids)
      this.props.selectSteps()
    }
  }

  render () {
    return <Inspector header={this.props.selected_step_ids.length + ' files'}
                      title="">
      <div className="kskp-form">
        <Button onClick={(e) => this.onClickDelete(e)} danger={true}>
          削除する
        </Button>
      </div>
    </Inspector>
  }

}

export default MultiInspector