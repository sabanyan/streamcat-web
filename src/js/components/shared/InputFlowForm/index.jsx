import React from 'react'
import AddButton from '../AddButton'
import HttpUtil from '../../../utils/HttpUtil'
import APIUtil from '../../../utils/APIUtil'
import style from './style.scss'

type Props = {
}

type State = {
  inputDatas : [],
} 

export default class InputFlowForm extends React.Component<Props, State> {
    constructor (props) {
        super(props)
    }

    onClickInput(e) {
      const name = e.currentTarget.getAttribute("name")
      HttpUtil.windowOpen("library?dialog=true",(args)=>{
        const selected_data:LibraryListDataType = args
        const uuid = selected_data.uuid

        // update
        let runArgs = this.props.runArgs
        const flows  = runArgs.flows.map((f) => {
          if (f.name == name) {
            
            f.uuid = uuid
          }
          return f
        })
        runArgs.flows = flows
        this.props.updateRunArgs(runArgs)
      })
    }

    renderAddInputFlowButton(name, uuid) {
      const content = (uuid) ?
        name + " : " + uuid
        :
        name + " : 入力ファイルを選択してください"
      return  <AddButton
        name = {name}
        onClick={(e) => this.onClickInput(e)}
        type={'text'} style={style}>
        {content}
      </AddButton>
    }

    renderInputFlowForm(flow) {
      const {ports} = flow  

      if (ports[0].length === 0) {
        return null
      }

      const runArgs = this.props.runArgs
      const result = []
      for (const f of runArgs.flows) {
        const form = <div key = {f.name} className={style ? style.flow_param : null}>
          <div className={style ? style.left : null}>
            {this.renderAddInputFlowButton(f.name, f.uuid)}
          </div>
          <div className={style ? style.right : null}>
          </div>
        </div>
        result.push(form)
      }
      
      return result
    }

    renderFlowVariableForm(flow) {
      const params = flow.params 
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

    onChangeVariable(e) {
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
      let inputFlowForm, inputVariableForm

      inputFlowForm = this.renderInputFlowForm(flow)
      inputVariableForm = this.renderFlowVariableForm(flow)

      return <div>
        <label>入力ファイル</label>
          {inputFlowForm}
        <label>フロー変数</label>
          {inputVariableForm}
      </div>
    }
}