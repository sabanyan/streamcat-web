//@flow
import * as React from 'react'
import style from '../../style.scss'
import DropDownList from '../../../DropDownList/index'
import CommandStepModel from '../../../../../model/Step/CommandStepModel'
import SubFlowStepModel from '../../../../../model/Step/SubFlowStepModel'
import CommandModel from '../../../../../model/Command/CommandModel'
import FlowUtil from '../../../../../utils/FlowUtil'
import type { CommandPortType, SubFlowParamType } from '../../../../../types/index'
import DataFrameStepModel from '../../../../../model/Step/DataFrameStepModel'
import StateUtil from '../../../../../utils/State'
import FlowModel from '../../../../../model/Flow/FlowModel'

class InOutConnector extends React.Component{

  onChangeInEdge(e,data,label){
    const {selectedStep} = this.props
    let newSelectedStep = StateUtil.deepCopy(selectedStep)
    //labelにポート名
    //data.objectにデータフレームが格納されいてる
    const dataSource:DataFrameStepModel = data.object
    newSelectedStep.srcs[label] = dataSource.id
    this.props.updateStep(newSelectedStep)
  }


  render () {
    const {nodes,onChangeInEdge,onChangeOutEdge,selectedStep,mast} = this.props
    const {selected_in_edges,selected_out_edges} = this.props
    //すべてのデータフレーム先をリスト化

    let dataFrameOnlyNodes:[DataFrameStepModel] = FlowUtil.getAllDataFrame(nodes)

    let dataSourceOptions = []

    dataFrameOnlyNodes.forEach((dataFrame)=>{
      dataSourceOptions.push({value: dataFrame.id, label: dataFrame.getLabel(), object: dataFrame})
    })

    let command:CommandModel
    let inEdgeSelect = []
    if(selectedStep instanceof SubFlowStepModel || selectedStep instanceof CommandStepModel) {

      inEdgeSelect = Object.keys(selectedStep.srcs).map((key,index)=>{
        let dataFrameId: string
        dataFrameId = selectedStep.srcs[key]
        const portName = key
        return <div key={index} className={style.param}>
          <DropDownList disabled={false} key={"in_edge"}
                        onChange={(e, data, label) => this.onChangeInEdge(e, data, label)} defaultValue={dataFrameId}
                        list={dataSourceOptions} label={portName} hiddenNoSelect={false}></DropDownList>
        </div>
      })


//      inEdgeSelect = selected_in_edges.map((edge, index) => {
//        let dataFrameId: string
//        dataFrameId = edge.v //Source(v)が入力のデータフレームのIDのため
//        const portName:string = JSON.parse(edge.name).port_name
//        return <div key={index} className={style.param}>
//          <DropDownList disabled={false} key={"in_edge"}
//                        onChange={(e, data, label) => this.onChangeInEdge(e, data, label)} defaultValue={dataFrameId}
//                        list={dataSourceOptions} label={portName} hiddenNoSelect={false}></DropDownList>
//        </div>
//      })
    }

    let output = selected_out_edges.map((edge,index)=>{
      const node = FlowUtil.getNodeFromID(nodes,edge.w)//Target(w)が出力先のデータフレームのIDのため
      return <div key={index} className={style.output}>{node.getLabel()}</div>
    })

    return  <div className="kskp-form">
          <label>入力</label>
          {inEdgeSelect}
          <label>出力</label>
          {output}
        </div>
  }

}

export default InOutConnector