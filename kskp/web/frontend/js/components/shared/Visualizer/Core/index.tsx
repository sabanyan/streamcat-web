import * as React from 'react'

import { API } from 'Modules/api/index'
import { CommandParamType } from 'Types/index'
import { StateUtil } from 'Utils/index';
import style from './style.scss'

import { VisualizeModel, MessageModel } from 'Model/index';

import { EmptyState, Loader } from 'Shared/Base'
import { PreviewInspector } from 'Shared/Inspector'
import FlowModel from '../../../../model/Flow/FlowModel';


type Props = {
  flow: FlowModel
  lockUUID: string;
  index: number;
  visualize: VisualizeModel;
  flow_uuid: string;
  stepIds: string[];
  frame_uuid: string;
  result: {
    args: {},
    html: any
  };
  headers: string[]

  onSaveResult: Function;
  notify: Function;
  dismissNotify: Function;
}

type State = {
  headers: string[]
  html?: any;
  args: {};
  isLoading: boolean;
}

export default class Visualizer extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)
    const initialArgs = this.initArgs(props.visualize, {})

    this.state = {
      headers: props.headers,
      html: null,
      args: initialArgs,
      isLoading: (props.result) ? false : true
    }
  }

  initArgs(visualize: VisualizeModel, args: {}) {
    let result = {}
    try {
      const command = { ...visualize }
      if (!command) throw "command is undefined in Visualizer"
      if (!command.params) throw "command.params is undefined in Visualizer"
      const params = StateUtil.deepCopy(command.params)
      const rules = (command.rules) ? command.rules : {}

      params.map((param: CommandParamType) => {
        // 1.ルールの適用
        const rule = rules[param.name]
        // rule: 必須項目で空白（""）が許される場合
        if (rule && rule["presence"] && ["presence"]["allowEmpty"] === true) result[param.name] = ""
        // 2.default値の適用
        if (param.default) result[param.name] = param.default
        // 3.保存されたユーザー入力値の適用
        if (args[param.name]) result[param.name] = args[param.name]
      })
    } catch (e) {
      console.log(e)
    }

    return result
  }

  componentDidMount() {
    this.onLoad()  
  }

  // とりあえず、/put　flows・/post vizを投げる
  onTestLoad() {
    const { result, visualize } = this.props
    this.setState({
      isLoading: true
    }, () => {
      this.requestVisualize()
        .then(() => {
          this.setState({
            isLoading: false
          })
        })
    })
  }

  saveFlow() {
    const { flow, lockUUID, notify, flow_uuid } = this.props

    return new Promise(async (reslove, reject) => {

      if (!lockUUID) throw new MessageModel({
        title: '警告：読取専用フロー',
        message: 'このフローはすでに編集中のため、 編集権限が取得できませんでした。',
        messageStatus: "warning"
      })
      
      await API.request.doPut.flow(
        {
          flowUUID: flow_uuid,
          flow: flow,
          lockUUID: lockUUID
        }
      )

      reslove()
    }) // flow 保存に失敗した場合、
      .catch(e => {
        notify({
          title: e.title,
          message: e.message,
          status: e.messageStatus,
          dismissAfter: -1,
          closeButton: true
        })
      })
  }

  onLoad() {
    const { result, visualize } = this.props
    const args = this.state.args
    this.setState({
      isLoading: true
    }, () => {
      // 保存された結果がある場合、
      if (result) {
        this.setState({
          html: result.html,
          args: result.args,
          isLoading: false
        })
      } else {
        // 保存された結果がない場合、
        this.setState({
          html: null,
          args: this.initArgs(visualize, {})
        }, () => {
          this.requestVisualize()
            .then(() => {
              this.setState({
                isLoading: false
              })
            })
        })
      }
    })
  }

  requestVisualize() {
    const { index, flow_uuid, stepIds, frame_uuid, visualize } = this.props
    const { onSaveResult, notify } = this.props
    console.log("request viz")
    return API.request.doPost.vizs({
      flowUUID: flow_uuid,
      stepIds: stepIds,
      frameUUID: frame_uuid,
      vizId: visualize.id,
      args: this.state.args
    })
      .then((res) => {
        console.log("response viz")
        // JSON Parser
        let json = API.response.post.vizs(res)
        // TODO: 将来はModel
        let headers = json[0].args.column_names
        let contents = json[0].contents
        let args = this.state.args
        const result = {
          html: contents,
          args: args
        }
        onSaveResult(index, result, headers)
        this.setState({ args: args, html: contents })
      })
      .catch((exception) => {
        this.setState({
          html: null,
          args: this.initArgs(visualize, {})
        })
        if (exception.message !== "VisualizeInitException") {
          notify({
            title: exception.title,
            message: exception.message,
            status: (exception.messageStatus) ? exception.messageStatus : "error",
            dismissAfter: 0,
            closeButton: true
          })
        }
        console.log(exception)
      })
  }

  /**
   * csvtothmlttableのときのみlimitをつける
   * @param id
   * @returns {string}
   */
  getLimitWhenCsvToHTMLTable(id: string) {
    if (id === 'csvtohtmltable') {
      return '&limit=1000'
    }
    return ''
  }

  apply(args: {}) {
    this.setState({ args: args, isLoading: true }, () => {
      this.requestVisualize()
        .then(() => {
          this.setState({ isLoading: false })
        })
    })
  }

  componentDidUpdate() {
    //visualizeRequestで取得したhtml内のscriptがrenderされた後にscriptを再取得
    const scripts = $('.visualize-component').find('script')
    if (scripts[0]) {
      //再度appendし直してjsを実行させる
      this.innerHTMLScriptReLaunch(scripts[0])
    }
  }

  /**
   * innerHTMLのscriptをappendし直して実行させる
   * @param script
   */
  innerHTMLScriptReLaunch(script) {
    var s = document.createElement('script')
    script.src ? (s.src = script.src) : (s.innerHTML = script.innerHTML)
    s.async = false
    document.head.append(s)
    s.remove()
  }

  onBoleanArgsChange(e, param, value) {
    if (!this || !this.state || !param) {
      return
    }
    let args = this.state.args
    args[param.name] = value
    this.setState({ args: args })
  }

  renderContents() {
    let result
    if (!this.state.html) {
      result = <EmptyState title={'表示することができません'} description={'条件を変更して表示ボタンを押してください'} icon={'cloud_off'} />
    } else {
      result = <div className={style.visualizeContainer}>
        <div dangerouslySetInnerHTML={{ __html: this.state.html }}></div>
      </div>
    }

    return result
  }

  render() {
    const { visualize } = this.props

    if (this.state.isLoading) return <Loader center={true} visible={this.state.isLoading} />

    return <div>
      {this.renderContents()}
      <PreviewInspector headers={this.state.headers}
        onApply={(args) => this.apply(args)}
        params={visualize.params}
        args={this.state.args}
        groups={visualize.groups}
        label={visualize.label} />
    </div>
  }
}
