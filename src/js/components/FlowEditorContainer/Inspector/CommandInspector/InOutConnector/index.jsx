import * as React from 'react'
import style from '../../style.scss'
import DropDownList from '../../../../shared/DropDownList/index'
import CommandStepModel from '../../../../../model/CommandStepModel'
import SubFlowStepModel from '../../../../../model/SubFlowStepModel'

class InOutConnector extends React.Component{

  render () {

    const {nodes} = this.props
    const {selected_in_edges,selected_out_edges} = this.props

    //すべてのデータフレーム先をリスト化
    let dataSourceOptions = new Set()
    Object.keys(nodes).forEach((key)=>{
      if (nodes[key] instanceof CommandStepModel){
        let step:CommandStepModel = nodes[key]

        Object.keys(step.dsts).forEach((key)=>{
          const dst = step.dsts[key]
          dataSourceOptions.add({value: dst, label: dst, object: step})
        })
        Object.keys(step.srcs).forEach((key) => {
          const src = step.srcs[key]
          dataSourceOptions.add({value: src, label: src, object: step})
        })
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