//@flow
import * as React from 'react'
import style from '../../style.scss'
import DropDownList from '../../../DropDownList/index'
import CommandStepModel from '../../../../../model/Step/CommandStepModel'
import SubFlowStepModel from '../../../../../model/Step/SubFlowStepModel'
import CommandModel from '../../../../../model/Command/CommandModel'
import FlowUtil from '../../../../../utils/FlowUtil'
import type { CommandPortType, StepModelType, SubFlowParamType } from '../../../../../types/index'
import DataFrameStepModel from '../../../../../model/Step/DataFrameStepModel'
import StateUtil from '../../../../../utils/State'
import FlowModel from '../../../../../model/Flow/FlowModel'
import Button from '../../../Button'
import ModalUtil from '../../../../../utils/ModalUtil'
import Constants from '../../../../../constants'

class InOutConnector extends React.Component{

  onChangeInEdge(e,data,label){
    const {selectedStep} = this.props
    let newSelectedStep = StateUtil.deepCopy(selectedStep)
    //labelにポート名
    //data.objectにデータフレームが格納されている
    if(data.object){
      //ノードが選択されたとき
      const dataSource:DataFrameStepModel = data.object
      newSelectedStep.srcs[label] = dataSource.id
      this.props.updateStep(newSelectedStep)
    }else{
      //「選択してください」が選択されたときはノードのつながりを削除する
      const dataSource:DataFrameStepModel = data.object
      newSelectedStep.srcs[label] = null
      this.props.updateStep(newSelectedStep)
    }
  }

  deletePort(step:StepModelType,portName:string){

    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        step.deleteInPort(portName)
        this.props.updateStep(step)
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたポートを削除しますか？
      </div>,
    })

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
      inEdgeSelect = Object.keys(selectedStep.srcs).map((key, index) => {
        let dataFrameId: string
        dataFrameId = selectedStep.srcs[key]
        const portName = key
        return <div key={index} className={style.param}>
          <DropDownList disabled={false}
                        key={"in_edge"}
                        onChange={(e, data, label) => this.onChangeInEdge(e, data, label)}
                        defaultValue={dataFrameId}
                        list={dataSourceOptions}
                        label={portName}
                        hiddenNoSelect={false}
                        actionLabel = {"削除"}
                        onClickAction = {()=>this.deletePort(selectedStep,portName)}
          ></DropDownList>

        </div>
      })
    }

    const output = Object.keys(selectedStep.dsts).map((key,index)=>{
      let dataFrameId: string
      dataFrameId = selectedStep.dsts[key]
      const node = FlowUtil.getNodeFromID(nodes,dataFrameId)
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