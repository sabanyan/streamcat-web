//@flow
import React from 'react'
import BaseInspector from '../BaseInspector/index'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import Button from '../../Button/index'
import CommandSelector from '../../CommandSelector/index'
import DataFrameStepModel from '../../../../model/Step/DataFrameStepModel'
import CommandStepModel from '../../../../model/Step/CommandStepModel'
import Graph from '../../../../utils/Graph'
import ModalUtil from '../../../../utils/ModalUtil'
import Constants from '../../../../constants/index'
import APIUtil from '../../../../utils/APIUtil'
import SubFlowStepModel from '../../../../model/Step/SubFlowStepModel'

class MultiInspector extends React.Component<FlowEditorProps> {
  onClickDelete (e: Event) {

    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        let {selected_step_ids} = this.props
        this.props.deleteSteps(selected_step_ids)
        this.props.selectSteps()
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたステップを削除しますか？
      </div>,
    })
  }

  getNumberOfSelectedDataSources(){
    const {nodes,selected_step_ids} = this.props
    let cnt = 0
    let hasMixedCommand = false //コマンドが混ざって選択されている場合
    selected_step_ids.forEach((id)=>{
      const node = Graph.getNode(nodes,id)
      if(node instanceof DataFrameStepModel){
        cnt++
      }else if(node instanceof SubFlowStepModel){
        hasMixedCommand = true
      }else if(node instanceof CommandStepModel){
        hasMixedCommand = true
      }
    })
    if(hasMixedCommand)return 0
    return cnt
  }


  render () {
    const numberOfSelectedDataSources = this.getNumberOfSelectedDataSources()

    let commandSelector
    if(numberOfSelectedDataSources){
      commandSelector =<div>
        <CommandSelector numberOfInput={numberOfSelectedDataSources} {...this.props}/>
      </div>
    }

    return <BaseInspector header={""}
                      title={this.props.selected_step_ids.length + ' files'}>
      <div className="kskp-form">
        <Button onClick={(e) => this.onClickDelete(e)} danger={true}>
          削除する
        </Button>
      </div>
      {commandSelector}
    </BaseInspector>
  }

}

export default MultiInspector