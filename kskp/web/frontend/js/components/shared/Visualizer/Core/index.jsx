//@flow
import * as React from 'react'
import { VisualizeModel } from 'Model/index'
import { HttpUtil } from 'Utils/index'
import { EmptyState, Loader } from 'Shared/Base'
import { PreviewInspector } from 'Shared/Inspector'
import style from './style.scss'

type Props = {
  visualize: VisualizeModel,
  params: VisualizeParams;
  frame_uuid: string;
  headers: []
}

type State = {
  html?: any;
  args: {};
  is_loading: true;
}

export default class Visualizer extends React.Component<Props, State> {
  inputRefs: any[]

  constructor (props: Props) {
    super(props)
    this.inputRefs = []
    this.state = {
      html: (props.result) ? props.result.html : null,
      args: (props.result) ? props.result.args : this.initArgs(props.visualize, {}),
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
      is_loading: false
    }, () => {
      if (result) this.forceUpdate()
      if (!result) this.visualizeRequest(visualize, this.state.args)
    })
  }

  visualizeRequest (visualize: VisualizeModel, args: {}) {
    const uuid = this.props.frame_uuid
    const body = {'args': args, 'inputs': {'i': uuid}}
    // 現在Limitはクエリパラメーターではなく、Bodyのargs{limit:}を使ってるため
    //const limit = this.getLimitWhenCsvToHTMLTable(visualize.id)

    this.setState({is_loading: true})
    HttpUtil.post('visualizers?from=' + visualize.id, body).then((res) => {
      // 結果を保存
      if (this.props.onSaveResult) {
        const index = this.props.index
        const result = {
          html: res.data,
          args: args
        }
        this.props.onSaveResult(index, result)
      }
      this.setState({args: args, html: res.data, is_loading: false})
    }).catch((error) => {
      if (error) {
        this.setState({is_loading: false})
      }
    })
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
      this.visualizeRequest(this.props.visualize, this.state.args)
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

  render () {
    const {visualize, headers, frame_uuid} = this.props
    const args = this.state.args
    const is_loading = this.state.is_loading

    if (is_loading) return <Loader center={true} visible={true} />

    let content
    if (!this.state.html) content = <EmptyState title={'表示することができません'} description={'条件を変更して反映ボタンを押してください'} icon={'cloud_off'} />
    if (this.state.html) content = <div className={style.visualizeContainer}>
      <div dangerouslySetInnerHTML={{__html: this.state.html}}></div>
    </div>

    return <div>
      {content}
      <PreviewInspector headers={headers}
                        onApply={(args) => this.apply(args)}
                        params={visualize.params}
                        args={args}
                        groups={visualize.groups}
                        label={visualize.label} />
    </div> 
  }
}
