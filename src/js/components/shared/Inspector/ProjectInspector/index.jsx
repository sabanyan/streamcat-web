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
import InspectorKnob from '../InspectorKnob'
import Resizer from '../Resizer'

type Props = {
  project: {};
  onClickDelete: Function;
}

class ProjectInspector extends React.Component<Props> {
  constructor (props) {
    super(props)
    this.state = {
      selected_tab_id: 0,
    }
  }

  onClickTab (e, tab_id) {
    this.setState({selected_tab_id: tab_id})
  }

  nullInspector () {
    return <Resizer>
      <BaseInspector {...this.props} >
      </BaseInspector>
    </Resizer>
  }

  render () {
    const {project} = this.props
    if (!project) {
      return this.nullInspector()
    }
    let content = null
    const uuid = project.uuid
    const name = project.name
    const creator_name = project.creator_name
    const created_at = project.created_at
    const description = project.description
    const selected_tab_id = this.state.selected_tab_id
    content = <div>
      <div className={style.actions}>
        <Button danger={true}
                onClick={() => this.props.onClickDelete(uuid)}>削除する</Button>
      </div>
      <div className={style.full_hr}/>
      <div>
        <div>
          <label>プロジェクト名</label>
        </div>
        <div>
          {name}
        </div>
        <div>
          <label>説明</label>
        </div>
        <div>
          {description}
        </div>
        <div>
          <label>作成者</label>
        </div>
        <div>
          {creator_name}
        </div>
        <div>
          <label>作成日時</label>
        </div>
        <div>
          {created_at}
        </div>
      </div>
      {/*<TabBar>*/}
      {/*<TabList>*/}
      {/*<Tab tab_id={0} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>概要</Tab>*/}
      {/*<Tab tab_id={1} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>フロー</Tab>*/}
      {/*<Tab tab_id={2} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>アクティビティ</Tab>*/}
      {/*<Tab tab_id={3} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>資料</Tab>*/}
      {/*</TabList>*/}
      {/*</TabBar>*/}
      {/*<TabPanel tab_id={0} selected_tab_id={selected_tab_id} >*/}
      {/*<div>*/}
      {/*<label>プロジェクト名</label>*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*{name}*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*<label>説明</label>*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*{description}*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*<label>作成者</label>*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*{creator_name}*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*<label>作成日時</label>*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*{created_at}*/}
      {/*</div>*/}
      {/*<div className={style.hr}/>*/}
      {/*<label>プロジェクトアサインメンバー</label>*/}
      {/*<div className={"mb-12px"}>*/}
      {/*アサインされているメンバーがいません*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*<Button>メンバーを追加する</Button>*/}
      {/*</div>*/}
      {/*</TabPanel>*/}
      {/*<TabPanel tab_id={1} selected_tab_id={selected_tab_id} >*/}
      {/*<label>フロー</label>*/}
      {/*<div>*/}
      {/*1個*/}
      {/*</div>*/}
      {/*<label>サブフロー</label>*/}
      {/*<div>*/}
      {/*3個*/}
      {/*</div>*/}
      {/*<div className={style.hr}/>*/}
      {/*<label>現在実行中のフロー</label>*/}
      {/*<div>*/}
      {/*現在実行中のフローはありません*/}
      {/*</div>*/}
      {/*</TabPanel>*/}
      {/*<TabPanel tab_id={2} selected_tab_id={selected_tab_id} >*/}
      {/*<label>アクティビティ</label>*/}
      {/*<div className={style.activity}>*/}
      {/*<div className={style.activity_log}>*/}
      {/*<a href="#">サンプルフロー</a> を追加しました。*/}
      {/*</div>*/}
      {/*<div className={style.activity_user}>*/}
      {/*山田太郎*/}
      {/*</div>*/}
      {/*<div className={style.activity_time}>*/}
      {/*2019-01-08 22:03:03*/}
      {/*</div>*/}
      {/*</div>*/}
      {/*<div className={style.activity}>*/}
      {/*<div className={style.activity_log}>*/}
      {/*<a href="#">サンプルファイル</a> を資料にアップロードしました。*/}
      {/*</div>*/}
      {/*<div className={style.activity_user}>*/}
      {/*山田太郎*/}
      {/*</div>*/}
      {/*<div className={style.activity_time}>*/}
      {/*2019-01-08 22:03:03*/}
      {/*</div>*/}
      {/*</div>*/}

      {/*</TabPanel>*/}
      {/*<TabPanel tab_id={3} selected_tab_id={selected_tab_id} >*/}
      {/*<label>資料</label>*/}
      {/*<div className={"text-right mb-12px"}>*/}
      {/*<Button>資料を追加する</Button>*/}
      {/*</div>*/}
      {/*<table className={style.file_list_table}>*/}
      {/*<thead>*/}
      {/*<th>ファイル名</th>*/}
      {/*<th>種類</th>*/}
      {/*<th>ユーザ名</th>*/}
      {/*<th>日時</th>*/}
      {/*</thead>*/}
      {/*<tbody>*/}
      {/*<tr>*/}
      {/*<td><a href={"#"}>サンプルファイル</a></td>*/}
      {/*<td>.xls</td>*/}
      {/*<td>山田太郎</td>*/}
      {/*<td>2019-01-08 23:00:01</td>*/}
      {/*</tr>*/}
      {/*</tbody>*/}
      {/*</table>*/}
      {/*</TabPanel>*/}
    </div>

    return <Resizer>
      <BaseInspector label={name} {...this.props} >
        {content}
      </BaseInspector>
    </Resizer>
  }

}

export default ProjectInspector