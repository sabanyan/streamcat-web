//@flow
import * as React from 'react'
import { VisualizeModel } from 'Model/index'
import { APIUtil } from 'Utils/index'
import { EmptyState, Loader } from 'Shared/Base'
import { PreviewInspector } from 'Shared/Inspector'
import style from './style.scss'
import {API} from 'Modules/api/index'

type Props = {
  visualize: VisualizeModel,
  flow_uuid: string;
  stepIds: string[];
  frame_uuid: string;
  headers: string[];
}

type State = {
  html?: any;
  args: {};
  is_loading: true;
}

export default class Visualizer extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    const initialArgs = this.initArgs(props.visualize, {})

    this.state = {
      headers : [],
      html: (props.result) ? props.result.html : null,
      args: (props.result) ? props.result.args : initialArgs,
      is_loading: (props.result) ? false : true
    }

  }

  initArgs(visualize: VisualizeModel, args:{}) {
    let result = args
    try {
      const command = visualize
      if (!command) throw "command is undefined in Visualizer"
      if (!command.params) throw "command.params is undefined in Visualizer"
      const params = command.params
      const rules = (command.rules) ? command.rules : {}
      params.map((param:CommandParamType) => {
        // 1.ルールの適用
        const rule = rules[param.name]
        // rule: 必須項目で空白（""）が許される場合
        if (rule && rule["presence"] && ["presence"]["allowEmpty"] === true) result[param.name] = ""
        // 2.default値の適用
        if (param.default) result[param.name] = param.default
        // 3.保存されたユーザー入力値の適用
        if (args[param.name]) result[param.name] = args[param.name]
      })
    } catch(e) {
      console.log(e)
    }

    return result
  }

  componentWillMount () {
    const {result, visualize} = this.props
    const args = this.state.args
    this.setState({
      html: (result) ? result.html : null, 
      args: (result) ? result.args : this.initArgs(visualize, args), 
      is_loading: true
    }, () => {
      if (result) {
        this.setState({
          is_loading : false
        })
      } 
      if (!result) {
        this.requestVisualize()
      }
    })
  }

  getRequest (args) {
    const {flow_uuid, stepIds, frame_uuid, visualize} = this.props
    let url, body

    if (flow_uuid && stepIds[0]) {
      url   = 'vizs?from=' + flow_uuid
      let stepId = stepIds[0]
      body  = {}
      body[stepId] = {
        "args"  : {
          "visualizer" : visualize.id,
          ...args
        }
      }
    } else if (frame_uuid) {
      url = 'vizs/' + frame_uuid
      body = {
        "args" : {
          "visualizer" : visualize.id,
          ...args
        }
      }
    }

    const result = {
      url   : url,
      body  : body
    }
    return result
  }

  requestVisualize () {
    const {flow_uuid, stepIds, frame_uuid, onSaveResult, index} = this.props
    const args = this.state.args
    const {url, body} = this.getRequest(args)
   

    this.setState({is_loading: true})
    try {
      APIUtil.post(url, body).then((res) => {
        if (!res.data.success) throw res.data.message

        const lasts = res.data.lasts
        const contents = lasts[0].contents
        const headers = lasts[0].args.column_names
        const result = {
          html: contents,
          args: args
        }
        this.props.onSaveResult(index, result)
        this.setState({headers: headers, args: args, html: contents, is_loading: false})
      }).catch((error) => {
        this.setState({is_loading: false})
      })
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * csvtothmlttableのときのみlimitをつける
   * @param id
   * @returns {string}
   */
  getLimitWhenCsvToHTMLTable (id: string) {
    if (id === 'csvtohtmltable') {
      return '&limit=1000'
    }
    return ''
  }

  apply (args: {}) {
    this.setState({args: args}, () => {
      this.requestVisualize()
    })
  }

  componentDidUpdate () {
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
  innerHTMLScriptReLaunch (script) {
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
    this.setState({args:args})
  }

  renderContents() {
    let result
    if (!this.state || !this.state.html) {
      result = <EmptyState title={'表示することができません'} description={'条件を変更して反映ボタンを押してください'} icon={'cloud_off'} />
    } else {
      result = <div className={style.visualizeContainer}>
        <div dangerouslySetInnerHTML={{__html: this.state.html}}></div>
      </div>
    }

    return result
  }

  render () {

    const {visualize} = this.props
    const args = this.state.args
    const is_loading = this.state.is_loading

    if (is_loading) return <Loader center={true} visible={true} />

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
