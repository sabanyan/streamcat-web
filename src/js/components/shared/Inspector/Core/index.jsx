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
      let {selected_step_ids, nodes, mast, selected_tab_id, addStep, selectSteps, flow, updateFlow} = this.props

      let property

      if (selected_step_ids.length == 1) {
          if (selected_step_ids[0] === 'flow') {
              property = <FlowSettingsInspector
                  mast={mast}
                  selected_step_ids={selected_tab_id}
                  addStep={addStep}
                  selectSteps={selectSteps}
                  flow={flow}
                  updateFlow={updateFlow}
              />
      } else {
        const selected_step = GraphUtil.getNode(nodes, selected_step_ids[0])
        if (selected_step instanceof DataFrameStepModel) {
          property = <DataSourceInspector {...this.props}></DataSourceInspector>
        } else if (selected_step instanceof CommandStepModel) {
          property = <CommandInspector {...this.props}></CommandInspector>
        } else if (selected_step instanceof NoteStepModel) {
          property = <NoteInspector {...this.props}></NoteInspector>
        }
      }
    } else if (!selected_step_ids.length) {
      property = <FlowSettingsInspector {...this.props} />
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