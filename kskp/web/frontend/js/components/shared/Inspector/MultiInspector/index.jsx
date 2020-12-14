//@flow
import React from 'react'
import { BaseInspector } from 'Shared/Inspector'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import { Button } from 'Shared/Input'
import { CommandSelector } from "FlowEditorContainer/Command";
import { CommandStepModel, DataFrameStepModel, SubFlowStepModel } from 'Model/index'
import { GraphUtil, ModalUtil } from 'Utils/index'
import Constants from 'Constants/index'
import type { MastType } from "Types/index";

type MultiInspectorProps = {
  deleteSteps: Function;
  selectSteps: Function;
  nodes: [];
  mast: MastType;
  selected_step_ids: [];
  addStep: Function;
  selectSteps: Function;
  addHistory: Function;
  baseInspectorDisabled: boolean;
}

class MultiInspector extends React.Component<MultiInspectorProps> {
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

  getNumberOfSelectedDataSources () {
    const {nodes, selected_step_ids} = this.props
    let cnt = 0
    let hasMixedCommand = false //コマンドが混ざって選択されている場合
    selected_step_ids.forEach((id) => {
      const node = GraphUtil.getNode(nodes, id)
      if (node instanceof DataFrameStepModel) {
        cnt++
      } else if (node instanceof SubFlowStepModel) {
        hasMixedCommand = true
      } else if (node instanceof CommandStepModel) {
        hasMixedCommand = true
      }
    })
    if (hasMixedCommand) return 0
    return cnt
  }

  render () {
    const {mast,selected_step_ids,addStep,selectSteps,addHistory, baseInspectorDisabled, commandSelectorHidden} = this.props;
    const numberOfSelectedDataSources = this.getNumberOfSelectedDataSources()

    let commandSelector
    if (numberOfSelectedDataSources) {
      commandSelector = <div>
        <CommandSelector
            mast={mast}
            numberOfInput={numberOfSelectedDataSources}
            selected_step_ids={selected_step_ids}
            addStep={addStep}
            selectSteps={selectSteps}
            addHistory={addHistory}/>
      </div>
    }

    if(commandSelectorHidden){
      // コマンドセレクタ非表示の扱いの場合は表示しない
      commandSelector = null;
    }

    return <BaseInspector header={''}
                          title={this.props.selected_step_ids.length + ' files'}
                          disabled={baseInspectorDisabled}>
      <div className="kskp-form">
        <Button onClick={(e) => this.onClickDelete(e)} danger={true} disabled={baseInspectorDisabled}>
          削除する
        </Button>
      </div>
      {commandSelector}
    </BaseInspector>
  }

}

export default MultiInspector
