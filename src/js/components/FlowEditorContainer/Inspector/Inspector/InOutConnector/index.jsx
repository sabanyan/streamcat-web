import * as React from 'react'
import style from '../../style.scss'
import DataFrameModel from '../../../../../model/DataFrameModel'
import DropDownList from '../../../../shared/DropDownList'

class InOutConnector extends React.Component{

  render () {

    const {steps,data} = this.props
    const {selected_in_edges,selected_out_edges} = this.props

    const merged_steps = {...steps,...data}

    //すべてのデータフレーム先をリスト化
    let dataSourceOptions = []
    Object.keys(merged_steps).forEach((step_id)=>{
      if (merged_steps[step_id] instanceof DataFrameModel){
        let dataFrame:DataFrameModel = merged_steps[step_id]

        dataFrame.dsts.forEach((port)=>{
          dataSourceOptions.push({value:port,label:port,object:dataFrame})
        })
        dataFrame.srcs.forEach((port)=>{
          dataSourceOptions.push({value:port,label:port,object:dataFrame})
        })

      }
    })

    let inEdgeSelect = selected_in_edges.map((edge)=>{
      return <DropDownList disabled={true} key={"in_edge"} onChange={(e)=>this.onChangeInEdge(e)} defaultValue={edge.name} list={dataSourceOptions}></DropDownList>
    })

    if(!inEdgeSelect.length)inEdgeSelect = <DropDownList key={"in_edge"} onChange={(e)=>this.onChangeInEdge(e)} defaultValue={0} list={dataSourceOptions}></DropDownList>

    let outEdgeSelect = selected_out_edges.map((edge)=>{
      return <DropDownList disabled={true} key={"out_edge"} onChange={(e)=>this.onChangeOutEdge(e)} defaultValue={edge.name} list={dataSourceOptions}></DropDownList>
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