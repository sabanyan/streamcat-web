//@flow
import React from 'react'
import {
    CommandInspector,
    DataSourceInspector,
    FlowSettingsInspector,
    MultiInspector,
    NoteInspector,
    Resizer
} from 'Shared/Inspector'
import classnames from 'classnames'
import style from '../style.scss'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import { CommandStepModel, DataFrameStepModel, NoteStepModel } from 'Model/index'
import { GraphUtil } from 'Utils/index'

class Inspector extends React.Component<FlowEditorProps> {

  render () {
      let {selected_step_ids, nodes, mast, selected_tab_id, addStep, selectSteps, flow, updateFlow, notify, dismissNotify, selected_data_source_detail, loadFlowJSON, deleteSteps, addHistory, deleteCache, updateStep, sortStepSrcEnd} = this.props

      let property

      if (selected_step_ids.length == 1) {
          if (selected_step_ids[0] === 'flow') {
              property = <FlowSettingsInspector
                  mast={mast}
                  selected_step_ids={selected_step_ids}
                  addStep={addStep}
                  selectSteps={selectSteps}
                  flow={flow}
                  updateFlow={updateFlow}
                  addHistory={addHistory}
              />
      } else {
        const selected_step = GraphUtil.getNode(nodes, selected_step_ids[0])
        if (selected_step instanceof DataFrameStepModel) {
          property = <DataSourceInspector
              nodes={nodes}
              notify={notify}
              dismissNotify={dismissNotify}
              selected_data_source_detail={selected_data_source_detail}
              mast={mast}
              loadFlowJSON={loadFlowJSON}
              deleteSteps={deleteSteps}
              selectSteps={selectSteps}
              addHistory={addHistory}
              flow={flow}
              updateFlow={updateFlow}
              selected_step_ids={selected_step_ids}
              deleteCache={deleteCache}
              addStep={addStep}
              updateStep={updateStep}
          />
        } else if (selected_step instanceof CommandStepModel) {
          property = <CommandInspector
              selected_step_ids={selected_step_ids}
              mast={mast}
              nodes={nodes}
              updateStep={updateStep}
              addHistory={addHistory}
              selectSteps={selectSteps}
              deleteSteps={deleteSteps}
              sortStepSrcEnd={sortStepSrcEnd}
          />
        } else if (selected_step instanceof NoteStepModel) {
          property = <NoteInspector
              selected_step_ids={selected_step_ids}
              nodes={nodes}
              selectSteps={selectSteps}
              updateStep={updateStep}
              deleteSteps={deleteSteps}
          />
        }
      }
    } else if (!selected_step_ids.length) {
      property = <FlowSettingsInspector
          mast={mast}
          selected_step_ids={selected_step_ids}
          addStep={addStep}
          selectSteps={selectSteps}
          flow={flow}
          updateFlow={updateFlow}
          addHistory={addHistory}
      />
    } else {
      property = <MultiInspector {...this.props}></MultiInspector>
    }

    const property_class = classnames(style.property, style.in)

    return <Resizer>
      {property}
    </Resizer>
  }

}

export default Inspector