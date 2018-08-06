import * as React from 'react'
import style from '../../style.scss'
import DropDownList from '../../../../shared/DropDownList/index'
import CommandStepModel from '../../../../../model/Step/CommandStepModel'
import SubFlowStepModel from '../../../../../model/Step/SubFlowStepModel'

class InOutConnector extends React.Component{

  render () {

    const {nodes,onChangeInEdge,onChangeOutEdge} = this.props
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
      return <DropDownList disabled={false} key={"in_edge"} onChange={onChangeInEdge} defaultValue={edge.name} list={dataSourceOptions}></DropDownList>
    })

    if(!inEdgeSelect.length)inEdgeSelect = <DropDownList key={"in_edge"} onChange={onChangeInEdge} defaultValue={0} list={dataSourceOptions}></DropDownList>

    let output = selected_out_edges.map((edge)=>{
      return <div className={style.output}>{edge.name}</div>
    })

    return  <div className="kskp-form mb-20px">
          <div className={style.property_title}>
            入出力
          </div>
          <label>入力</label>
          {inEdgeSelect}
          <label>出力</label>
          {output}
        </div>
  }

}

export default InOutConnector