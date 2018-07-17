// @flow
import React from 'react'
import DataSourceInspector from './DataSourceInspector'
import classnames from 'classnames'
import style from './style.scss'
import type { FlowEditorProps } from '../index'
import MultiInspector from './MultiInspector'
import DataFrameModel from '../../../model/DataFrameModel'
import StepModel from '../../../model/StepModel'
import CommandInspector from './CommandInspector'

class Inspector extends React.Component<FlowEditorProps> {

  render () {
    let {selected_step_ids} = this.props

    let property,show
    const selected_step = this.props.nodes[selected_step_ids[0]]

    if (selected_step_ids.length == 1) {
      if (selected_step instanceof DataFrameModel) {
        property = <DataSourceInspector {...this.props}></DataSourceInspector>
      } else if (selected_step instanceof StepModel) {
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