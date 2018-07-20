// @flow
import React from 'react'
import DataSourceInspector from './DataSourceInspector'
import classnames from 'classnames'
import style from './style.scss'
import type { FlowEditorProps } from '../index'
import MultiInspector from './MultiInspector'
import DataFrameStepModel from '../../../model/DataFrameStepModel'
import CommandStepModel from '../../../model/CommandStepModel'
import CommandInspector from './CommandInspector'

class Inspector extends React.Component<FlowEditorProps> {

  render () {
    let {selected_step_ids} = this.props

    let property,show
    const selected_step = this.props.nodes[selected_step_ids[0]]

    if (selected_step_ids.length == 1) {
      if (selected_step instanceof DataFrameStepModel) {
        property = <DataSourceInspector {...this.props}></DataSourceInspector>
      } else if (selected_step instanceof CommandStepModel) {
        property = <CommandInspector {...this.props}></CommandInspector>
      }
      show = true
    } else if (!selected_step_ids.length) {
      show = false
    } else {
      property = <MultiInspector {...this.props}></MultiInspector>
      show = true
    }

    const property_class = classnames(style.property, {[style.in]: show})

    return <div className={property_class}>
      {property}
    </div>
  }

}

export default Inspector