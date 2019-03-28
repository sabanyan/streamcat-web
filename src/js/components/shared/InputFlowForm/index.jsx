import React from 'react'
import AddButton from '../AddButton'
import HttpUtil from '../../../utils/HttpUtil'
import ApiUtil from '../../../utils/ApiUtil'

type Props = {
}

type State = {
  inputDatas : [],
} 

export default class InputFlowForm extends React.Component<Props, State> {
    constructor (props) {
        super(props)
        this.runArgs = {
          flow_uuid : null,
          flows : [],
          variables : []
        }
    }

    onClickInput(e) {
      let name = e.currentTarget.getAttribute("name")
      const self = this
      HttpUtil.windowOpen("library?dialog=true",(args)=>{
        const selected_data:LibraryListDataType = args
        const uuid = selected_data.uuid

        // update
        let flows = self.runArgs.flows.map((f) => {
          if (f.name == name) {
            f.uuid = uuid
          }
        })
        self.updateRunArgs()
      })
    }

    renderAddInputFlowButton(name) {
      return  <AddButton
        name = {name}
        onClick={(e) => this.onClickInput(e)}
        type={'text'} className={'form-control'}>
        {name} : 入力ファイルを選択してください
      </AddButton>
    }

    initializeFlows(ports:[], flows:[]) {
      let result = ports.map((p) => {
        const target = flows.find((f) => f.name == p.name)
        if (target) {
          p.uuid = target.uuid
        }
        return p
      })

      return result
    }

    renderInputFlowForm(flow) {
      let style = null
      const {ports} = flow  

      if (ports[0].length === 0) {
        return null
      }
      this.runArgs.flows = this.initializeFlows(ports[0], this.runArgs.flows)

      const result = this.runArgs.flows.map((f) => {
        const form = <div key = {f.name} className={style ? style.flow_param : null}>
          <div className={style ? style.left : null}>
            {(f.uuid) ? f.name + " : " + f.uuid : this.renderAddInputFlowButton(f.name)}
          </div>
          <div className={style ? style.right : null}>
          </div>
        </div>

        return form
      })
      return result
    }

    renderFlowVariableForm(flow) {
      let vars = flow.params 
      let style = {}
      let form = vars.map((v) => {
        return <div key={v.name} className={style.flow_param}>
                  <div className={style.left}>
                    <input onChange={(e) => {this.onChangeVariable(e)}}
                    name={v.name}
                    type={'text'} className={'form-control'} placeholder={v.name} />
                  </div>
                  <div className={style.right}>
                </div>
              </div>
      })
      this.runArgs.variables = vars
  
      return <div>
        <label>フロー変数</label>
        {form}
      </div>
    }

    onChangeVariable(e) {
      const value = e.currentTarget.value
      const name = e.currentTarget.name

      let vars = this.runArgs.variables.map((v) => {
        if (v.name == name) {
          v.value = value
        }
        return v
      })
      this.runArgs.variables = vars
      this.updateRunArgs()
    
    }

    updateRunArgs() {
      this.props.parentProps.updateRunArgsAction(this.runArgs)
    }

    render () {
      if (!(this.props.parentProps)) {
        return null
      }
      
      
      this.runArgs = this.props.parentProps.runArgs
      this.runArgs.uuid = this.props.parentProps.flow.uuid
      console.log("render")
      console.log(this.runArgs)
      let inputFlowForm, inputParamForm
      inputFlowForm = this.renderInputFlowForm(this.props.parentProps.flow)
      inputParamForm = this.renderFlowVariableForm(this.props.parentProps.flow)
      return <div>
        <label>入力ファイル</label>
          {inputFlowForm}
          {inputParamForm}
      </div>
    }
}