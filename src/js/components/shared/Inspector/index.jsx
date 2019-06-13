//@flow
import React from 'react'
import DataSourceInspector from './DataSourceInspector/index'
import classnames from 'classnames'
import style from './style.scss'
import type { FlowEditorProps } from '../../FlowEditorContainer/index'
import MultiInspector from './MultiInspector/index'
import { CommandStepModel, DataFrameStepModel, NoteStepModel } from 'Model/index'
import CommandInspector from 'Shared/Inspector/CommandInspector/index'
import Graph from 'Utils/Graph'
import FlowSettingsInspector from 'Shared/Inspector/FlowSettingsInspector'
import NoteInspector from 'Shared/Inspector/NoteInspector'
import Resizer from './Resizer'

class Inspector extends React.Component<FlowEditorProps> {

  render () {
    let {selected_step_ids, nodes} = this.props

    let property

    if (selected_step_ids.length == 1) {
      if (selected_step_ids[0] === 'flow') {
        property = <FlowSettingsInspector {...this.props} />
      } else {
        const selected_step = Graph.getNode(nodes, selected_step_ids[0])
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