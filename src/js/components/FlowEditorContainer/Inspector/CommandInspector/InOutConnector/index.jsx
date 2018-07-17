import * as React from 'react'
import style from '../../style.scss'
import DataFrameModel from '../../../../../model/DataFrameModel'
import DropDownList from '../../../../shared/DropDownList/index'
import StepModel from '../../../../../model/StepModel'

class InOutConnector extends React.Component{

  render () {

    const {nodes} = this.props
    const {selected_in_edges,selected_out_edges} = this.props

    //すべてのデータフレーム先をリスト化
    let dataSourceOptions = []
    Object.keys(nodes).forEach((step_id)=>{
      if (nodes[step_id] instanceof StepModel){
        let step:StepModel = nodes[step_id]

        Object.keys(step.dsts).forEach((to)=>{
          dataSourceOptions.push({value:to,label:to,object:step})
        })
        Object.keys(step.srcs).forEach((from) => {
          dataSourceOptions.push({value: from, label: from, object: step})
        })

        console.log(dataSourceOptions)
      }
    })

    let inEdgeSelect = selected_in_edges.map((edge)=>{
      return <DropDownList disabled={false} key={"in_edge"} onChange={(e)=>this.onChangeInEdge(e)} defaultValue={edge.name} list={dataSourceOptions}></DropDownList>
    })

    if(!inEdgeSelect.length)inEdgeSelect = <DropDownList key={"in_edge"} onChange={(e)=>this.onChangeInEdge(e)} defaultValue={0} list={dataSourceOptions}></DropDownList>

    let outEdgeSelect = selected_out_edges.map((edge)=>{
      return <DropDownList disabled={false} key={"out_edge"} onChange={(e)=>this.onChangeOutEdge(e)} defaultValue={edge.name} list={dataSourceOptions}></DropDownList>
    })

    if(!outEdgeSelect.length)outEdgeSelect = <DropDownList key={"out_edge"} onChange={(e)=>this.onChangeOutEdge(e)} defaultValue={0} list={dataSourceOptions}></DropDownList>

    return  <div className="kskp-form mb-20px">
          <div className={style.property_title}>
            入出力
          </div>
          <label>入力</label>
          {inEdgeSelect}
          <label>出力</label>
          {outEdgeSelect}
        </div>
  }

}

export default InOutConnector