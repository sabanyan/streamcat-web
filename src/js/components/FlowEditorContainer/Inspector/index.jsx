// @flow
import React from 'react'
import DataSourceInspector from './DataSourceInspector'
import DataSourceModel from '../../../model/DataSourceModel'
import OperatorInspector from './OperatorInspector'
import OperatorModel from '../../../model/OperatorModel'
import FlowInspector from './FlowInspector'
import classnames from 'classnames'
import style from './style.scss'
import type { FlowEditorProps } from '../index'
import MultiInspector from "./MultiInspector";

class Inspector extends React.Component<FlowEditorProps> {

  render () {
    let {selected_step_ids} = this.props

    let property
    const selected_step = this.props.steps[selected_step_ids[0]]

      if(selected_step_ids.length == 1){
          if (selected_step instanceof DataSourceModel) {
              property = <DataSourceInspector {...this.props}></DataSourceInspector>
          } else if (selected_step instanceof OperatorModel) {
              property = <OperatorInspector {...this.props}></OperatorInspector>
          }
      }else if(!selected_step_ids.length){
          property = <FlowInspector>{...this.props}></FlowInspector>
      }else{
          property = <MultiInspector>{...this.props}></MultiInspector>
      }

    const property_class = classnames(style.kskp_property,{ [style.in]:true})

    return <div className={property_class}>
      {property}
    </div>
  }

}

export default Inspector