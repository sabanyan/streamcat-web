//@flow
import * as React from 'react'
import style from '../../style.scss'
import DropDownList from '../../../../shared/DropDownList/index'
import CommandStepModel from '../../../../../model/Step/CommandStepModel'
import SubFlowStepModel from '../../../../../model/Step/SubFlowStepModel'
import CommandModel from '../../../../../model/Command/CommandModel'
import FlowUtil from '../../../../../utils/FlowUtil'
import type { CommandPortType, SubFlowParamType } from '../../../../../types'
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
    console.log("onChangeInEdge")
    console.log(label)
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
      dataSourceOptions.push({value: dataFrame.id, label: dataFrame.label, object: dataFrame})
    })

    let command:CommandModel
    let inEdgeSelect = []
    if(selectedStep instanceof SubFlowStepModel){
      if(this.props.selectedSubFlow){
        const subFlow:FlowModel = this.props.selectedSubFlow
        inEdgeSelect = selected_in_edges.map((edge,index)=>{
          let inPorts:[CommandPortType]
          let port:CommandPortType
          if(subFlow){
            inPorts = subFlow.getInPorts()
            port = inPorts[index]
          }
          return <div key={index}>
            <DropDownList disabled={false} key={"in_edge"} onChange={(e,data,label)=>this.onChangeInEdge(e,data,label)} defaultValue={edge.name} list={dataSourceOptions} label={(port)?port.name:""}></DropDownList>
          </div>
        })
      }
    }else if(selectedStep instanceof CommandStepModel){
      command = selectedStep.getCommand(mast.commands)
      inEdgeSelect = selected_in_edges.map((edge,index)=>{
        let inPorts:[CommandPortType]
        let port:CommandPortType
        if(command){
          inPorts = command.getInPorts()
          port = inPorts[index]
        }
        return <div key={index}>
          <DropDownList disabled={false} key={"in_edge"} onChange={(e,data,label)=>this.onChangeInEdge(e,data,label)} defaultValue={edge.name} list={dataSourceOptions} label={(port)?port.name:""}></DropDownList>
        </div>
      })
    }

    let output = selected_out_edges.map((edge,index)=>{
      const node = FlowUtil.getNodeFromID(nodes,edge.name)
      return <div key={index} className={style.output}>{node.label}</div>
    })

    return  <div className="kskp-form mb-20px">
          <label>入力</label>
          {inEdgeSelect}
          <label>出力</label>
          {output}
        </div>
  }

}

export default InOutConnector