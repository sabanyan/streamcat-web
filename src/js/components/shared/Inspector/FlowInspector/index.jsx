//@flow
import React from 'react'
import Constants from 'Constants/index'
import ModalUtil from 'Utils/ModalUtil'
import style from '../style.scss'
import Button from 'Shared/Button'
import BaseInspector from 'Shared/Inspector/BaseInspector'
import type { FlowListDataType } from 'Types/index'
import moment from 'moment/moment'
import ReactDomUtil from 'Utils/ReactDomUtil'
import InputFlowForm from 'Shared/InputFlowForm'
import FlowUtil from 'Utils/FlowUtil'
import Resizer from 'Shared/Inspector/Resizer'

type Props = {
  project: {};
  onClickDelete: Function;
  onClickDuplicate: Function;
  onBlurTitle: Function;
}

class FlowInspector extends React.Component<Props> {

  constructor (props) {
    super(props)

    ModalUtil.registerModal({
      id: Constants.modal.RUN_FLOW, onClickDone: () => {
        this.run()
        //モーダルを閉じる
        ModalUtil.closeModal(Constants.modal.RUN_FLOW)
      },
    })
  }

  nullInspector () {
    return <Resizer>
      <BaseInspector {...this.props} >
      </BaseInspector>
    </Resizer>
  }

  resetRunArgsValue () {
    const runArgs = this.props.runArgs
    runArgs.flows = runArgs.flows.map((f) => {
      f.uuid = null
      return f
    })
    runArgs.variables = runArgs.variables.map((v) => {
      v.value = null
      return v
    })

    this.props.updateRunArgs(runArgs)
  }

  onClickRun () {
    this.resetRunArgsValue()

    let content = <InputFlowForm {...this.props} />

    ModalUtil.emitModal({
      id: Constants.modal.RUN_FLOW,
      visible: true,
      done: '実行する',
      cancle: 'キャンセル',
      dynamic: true,
      danger: false,
      content: content,
    })
  }

  run () {
    const {runArgs, notify, dismissNotify} = this.props
    //TODO RunArgsのValidate

    FlowUtil.runWithArgs(runArgs, notify, dismissNotify).then((response) => {
      this.resetRunArgsValue()
      if (response.data.success) {
        const json: RunResponseType = response.data
        const result = json.name.map((n, index) => {
          return <li key={index}>{n.id}</li>
        })
        const content = <div>
          <div>ライブラリにフローの実行結果が追加されました。</div>
          <ul>{result}</ul>
        </div>

        this.props.notify({
          title: 'フロー実行完了',
          message: ReactDomUtil.renderToString(content),
          status: 'success',
          dismissAfter: 0,
          buttons: [
            {
              name: '開く',
              primary: true,
              onClick: () => {
                window.open('/library?project=' +
                  window.navigationModel.project_uuid, '_blank')
              },
            }],
        })
      }
    })
  }

  render () {
    const flow: FlowListDataType = this.props.flow
    if (!flow) {
      return this.nullInspector()
    }
    let content = null
    const uuid = flow.uuid
    const label = flow.label
    const creator = flow.creator
    const createdAt = flow.createdAt
    const description = flow.description
    content = <div>
      <div className={style.actions}>
        <Button onClick={() => this.onClickRun()}>実行する</Button>
        <Button onClick={() => this.props.onClickDuplicate(uuid)}>複製する</Button>
        <Button danger={true}
                onClick={() => this.props.onClickDelete(uuid)}>削除する</Button>
      </div>
      <div className={style.full_hr}/>
      <div>
        <label>フロー名</label>
      </div>
      <div>
        {label}
      </div>
      <div>
        <label>説明</label>
      </div>
      <div>
        {(description) ? description : '説明がありません'}
      </div>
      <div>
        <label>作成者</label>
      </div>
      <div>
        {creator}
      </div>
      <div>
        <label>作成日時</label>
      </div>
      <div>
        {moment(createdAt).format(Constants.format.dateTime)}
      </div>
    </div>

    return <Resizer>
      <BaseInspector key={uuid + '_' + label} label={label} {...this.props} >
        {content}
      </BaseInspector>
    </Resizer>
  }

}

export default FlowInspector