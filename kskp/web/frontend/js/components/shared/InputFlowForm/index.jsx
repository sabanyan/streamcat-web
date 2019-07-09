import React from 'react'
import AddButton from '../AddButton'
import HttpUtil from '../../../utils/HttpUtil'
import style from './style.scss'

type Props = {}

type State = {
  inputDatas: [],
}

export default class InputFlowForm extends React.Component<Props, State> {
  constructor (props) {
    super(props)
  }

  onClickInput (e) {
    const name = e.currentTarget.getAttribute('name')
    HttpUtil.windowOpen('library?dialog=true', (args) => {
      const selected_data: LibraryListDataType = args
      const uuid = selected_data.uuid

      // update
      let runArgs = this.props.runArgs
      const flows = runArgs.flows.map((f) => {
        if (f.label == name) {
          f.uuid = uuid
        }
        return f
      })
      runArgs.flows = flows
      this.props.updateRunArgs(runArgs)
    })
  }

  renderAddInputFlowButton (key, value) {
    const content = (value) ?
      key + ' : ' + value
      :
      key + ' : 入力ファイルを選択してください'
    return <AddButton
      name={key}
      onClick={(e) => this.onClickInput(e)}
      type={'text'} style={style}>
      {content}
    </AddButton>
  }

  renderInputFlowForm (flow) {
    const runArgs = this.props.runArgs

    if (runArgs.length === 0) {
      return null
    }

    const result = []
    for (const f of runArgs.flows) {
      const key = f.label
      const value = f.uuid
      const form = <div key={key} className={style ? style.flow_param : null}>
        <div className={style ? style.left : null}>
          {this.renderAddInputFlowButton(key, value)}
        </div>
        <div className={style ? style.right : null}>
        </div>
      </div>
      result.push(form)
    }

    return result
  }

  renderFlowVariableForm (flow) {
    const params = flow.params

    if (params.length === 0) {
      return null
    }

    let forms = []
    for (const v of params) {
      const form = <div key={v.name} className={style.flow_param}>
        <div className={style.left}>
          <input onChange={(e) => {this.onChangeVariable(e)}}
                 name={v.name}
                 type={'text'} className={style.flow_param_input} placeholder={v.name} />
        </div>
      </div>
      forms.push(form)
    }

    return <div>
      {forms}
    </div>
  }

  onChangeVariable (e) {
    const value = e.currentTarget.value
    const name = e.currentTarget.name

    let runArgs = this.props.runArgs
    let vars = runArgs.variables.map((v) => {
      if (v.name == name) {
        v.value = value
      }
      return v
    })
    runArgs.variables = vars
    this.props.updateRunArgs(runArgs)
  }

  render () {
    const {flow} = this.props
    const inputFlowForm = this.renderInputFlowForm(flow)
    const inputVariableForm = this.renderFlowVariableForm(flow)

    return <div>
      <label className="inputFlow">入力フロー</label>
      {inputFlowForm}
      <label className="inputVar">フロー変数</label>
      {inputVariableForm}
    </div>
  }
}