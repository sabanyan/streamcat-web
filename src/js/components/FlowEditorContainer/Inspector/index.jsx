// @flow
import React from 'react'
import DataSourceInspector from './DataSourceInspector'
import DataSourceModel from '../../../model/DataSourceModel'
import OperatorInspector from './OperatorInspector'
import OperatorModel from '../../../model/OperatorModel'
import FlowInspector from './FlowInspector'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  selected_step_ids: any[];
  steps: {};
  selectSteps: Function;
  deleteStep: Function;
  updateStep: Function;
  mast: { operators: any[] };
}

class Inspector extends React.Component<Props> {

  render () {
    let {selected_step_ids} = this.props

    let property
    const selected_step = this.props.steps[selected_step_ids[0]]

    if (selected_step instanceof DataSourceModel) {
      property = <DataSourceInspector {...this.props}></DataSourceInspector>
    } else if (selected_step instanceof OperatorModel) {
      property = <OperatorInspector {...this.props}></OperatorInspector>
    } else {
      property = <FlowInspector>{...this.props}></FlowInspector>
    }
    //let slide_in = (selected_step_ids.length) ? " in" : ""

    const property_class = classnames(style.kskp_property,{ [style.in]:true})

    return <div className={property_class}>
      {property}
    </div>
  }

}

export default Inspector