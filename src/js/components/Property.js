import React from 'react'
import DataSourceProperty from './DataSourceProperty'
import DataSourceModel from '../model/DataSourceModel'
import OperatorProperty from './OperatorProperty'
import OperatorModel from '../model/OperatorModel'

class Property extends React.Component {

  render () {
    let {selected_step_ids} = this.props

    let property
    const selected_step = this.props.steps[selected_step_ids[0]]

    if (selected_step instanceof DataSourceModel) {
      property =  <DataSourceProperty {...this.props}></DataSourceProperty>
    }else if(selected_step instanceof OperatorModel){
      property = <OperatorProperty {...this.props}></OperatorProperty>
    }
    let slide_in = (selected_step_ids.length)?" in":""

    return <div className={"kskp-property" + slide_in}>
      {property}
    </div>
  }

}

export default Property