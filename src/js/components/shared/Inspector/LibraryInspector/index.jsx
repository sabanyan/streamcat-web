//@flow
import React from 'react'
import classnames from 'classnames'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../DataTable/index'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import style from '../style.scss'
import Button from '../../Button/index'
import DownloadButton from '../../Button/DownloadButton/index'
import BaseInspector from '../BaseInspector'
import type { StepModelType } from '../../../../types'
import HttpUtil from '../../../../utils/HttpUtil'
import Graph from '../../../../utils/Graph'
import type { CSVModelProps } from '../../../../model/CSV/CSVModel'
import CSVModel from '../../../../model/CSV/CSVModel'
import StringUtil from '../../../../utils/StringUtil'
import Inspector from '../index'
import TabBar from '../../TabBar'
import TabPanel from '../../TabBar/TabPanel'
import TabList from '../../TabBar/TabList'
import Tab from '../../TabBar/Tab'

type Props = {
  data: {};
}

class LibraryInspector extends React.Component<Props> {
  constructor (props) {
    super(props)
  }
  render () {

    const {data} = this.props
    let content = null
    if(data){
      content = <div>
          <div className={"mb-8px"}>
            {Object.keys(data.data)[0]}
          </div>
          <div className={style.actions}>

          </div>
          <div className={style.full_hr}/>
      </div>
    }

    return <div className={classnames(style.property,style.in)}>
      <BaseInspector {...this.props}>
      {content}
    </BaseInspector>
    </div>
  }

}

export default LibraryInspector