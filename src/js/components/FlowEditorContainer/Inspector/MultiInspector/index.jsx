// @flow
import React from 'react'
import Inspector from '../Inspector'
import type { FlowEditorProps } from '../../index'
import Button from '../../../shared/Button'
import CommandSelector from '../CommandSelector'
import DataFrameModel from '../../../../model/DataFrameModel'
import StepModel from '../../../../model/StepModel'

class MultiInspector extends React.Component<FlowEditorProps> {
  onClickDelete (e: Event) {
    if (window.confirm('これらコマンドを削除しますか？')) {
      let {selected_step_ids} = this.props
      this.props.deleteSteps(selected_step_ids)
      this.props.selectSteps()
    }
  }

  getNumberOfSelectedDataSources(){
    const {steps,data,selected_step_ids} = this.props
    let cnt = 0
    let hasMixedCommand = false //コマンドが混ざって選択されている場合
    selected_step_ids.forEach((id)=>{
      if(data[id] instanceof DataFrameModel){
        cnt++
      }else if(steps[id] instanceof StepModel){
        hasMixedCommand = true
      }
    })

    if(hasMixedCommand)return 0
    return cnt
  }


  render () {
    const numberOfSelectedDataSources = this.getNumberOfSelectedDataSources()

    console.log(numberOfSelectedDataSources)

    return <Inspector header={this.props.selected_step_ids.length + ' files'}
                      title="">
      <div className="kskp-form">
        <Button onClick={(e) => this.onClickDelete(e)} danger={true}>
          削除する
        </Button>
      </div>
      <hr/>
      <CommandSelector numberOfInput={numberOfSelectedDataSources} {...this.props}/>
    </Inspector>
  }

}

export default MultiInspector