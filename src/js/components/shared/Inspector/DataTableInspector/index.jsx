//@flow
import React from 'react'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../DataTable/index'
import Inspector from '../BaseInspector/index'
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

type Props = {
  uuid: string,
  title: string
}

class DataTableInspector extends React.Component<Props> {

  onClickCSVDownload(e:Event){
    const {uuid} = this.props
    const param = {
      type:"frame",
      uuid: uuid,
      ext:"csv"
    }
    HttpUtil.get("files",param).then((response)=>{
      let props:CSVModelProps = {
        uuid: uuid,
        data: response.data,
      }
      const csv:CSVModel = new CSVModel(props)
      csv.handleDownload()
    })
  }

  render () {
    const {title} = this.props
    const numberOfLines = StringUtil.separate(this.props.selected_data_source_detail.numberOfLines)
    const fileSize = StringUtil.convertToFileSize(this.props.selected_data_source_detail.fileSize)
    const lastModifiedAt = StringUtil.separate(this.props.selected_data_source_detail.lastModifiedAt)
    const content = <div>
      <div className={style.actions}>
        <DownloadButton download="image.png" href={this.props.image_url} onClick={(e)=>this.onClickCSVDownload(e)}>CSVダウンロード</DownloadButton>
      </div>
      <div className={style.full_hr}/>
      <div className={style.overviews}>
        <div className={style.overview}>
          <div className={style.overview_label}>
            データの件数
          </div>
          <div className={style.overview_value}>
            {numberOfLines} {/*{property.overview.count || 0}*/}
          </div>
        </div>
        <div className={style.overview}>
          <div className={style.overview_label}>
            ファイルサイズ
          </div>
          <div className={style.overview_value}>
            {fileSize}
          </div>
        </div>
        <div className={style.overview}>
          <div className={style.overview_label}>
            作成日
          </div>
          <div className={style.overview_value}>
            {lastModifiedAt} {/*{property.overview.created_at || ""}*/}
          </div>
        </div>
        <div className={style.overview}>
          <div className={style.overview_label}>
            作成者
          </div>
          <div className={style.overview_value}>
            {/*{property.overview.created_user_name || ""}*/}
          </div>
        </div>
      </div>
    </div>

    return <BaseInspector header={""} name={title} label={title} {...this.props}>
      {content}
    </BaseInspector>
  }

}

export default DataTableInspector