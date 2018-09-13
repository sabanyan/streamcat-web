//@flow
import React from 'react'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../DataTable/index'
import Inspector from '../BaseInspector/index'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import style from '../../DataPreview/style.scss'
import Button from '../../Button/index'
import DownloadButton from '../../Button/DownloadButton/index'
import BaseInspector from '../BaseInspector'

class DataTableInspector extends React.Component<FlowEditorProps> {

  render () {
    const {title} = this.props
    const content = <div>
      
    </div>

    return <BaseInspector header={""} title={title} {...this.props}>
      {content}
    </BaseInspector>
  }

}

export default DataTableInspector