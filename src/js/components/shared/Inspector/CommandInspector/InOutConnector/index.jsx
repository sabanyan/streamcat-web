//@flow
import * as React from 'react'
import style from '../../style.scss'
import DropDownList from 'Shared/DropDownList/index'
import { CommandStepModel, DataFrameStepModel, SubFlowStepModel } from 'Model/index'
import CommandModel from 'Model/Command/CommandModel'
import FlowUtil from 'Utils/FlowUtil'
import type { StepModelType } from 'Types/index'
import StateUtil from 'Utils/State'
import ModalUtil from 'Utils/ModalUtil'
import Constants from 'Constants/index'
import { AddButton } from 'Shared/Input'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'

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

  onClickAddEdge(step){
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        const nextIndex = step.getInPortIndex() + 1
        const newStep = StateUtil.deepCopy(step)
        newStep.addInPort("*" + nextIndex)
        this.props.updateStep(newStep)
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '追加する',
      content: <div>
        入力を追加しますか？
      </div>,
    })
  }

  deletePort(step:StepModelType,portName:string){
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        const newStep = StateUtil.deepCopy(step)
        newStep.deleteInPort(portName)
        this.props.updateStep(newStep)
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        {portName} の入力を削除しますか？
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
    let addEdgeContainer
    if(selectedStep instanceof SubFlowStepModel || selectedStep instanceof CommandStepModel) {

      addEdgeContainer = (selectedStep.addableInPort()) ? <AddButton onClick={()=>this.onClickAddEdge(selectedStep)}>入力を追加する</AddButton> : null
      selectedStep.srcsOrder.forEach((key, index) => {

        let dataFrameId: string
        dataFrameId = selectedStep.srcs[key]
        let portName = key

        const actionProps = (selectedStep.addableInPort()) ?{
          actionLabel:"削除",
          onClickAction:()=>this.deletePort(selectedStep,portName)
        } : null

        const item = <div key={index} className={style.param}>
          <DropDownList disabled={false}
                        key={"in_edge"}
                        onChange={(e, data, label) => this.onChangeInEdge(e, data, label)}
                        defaultValue={dataFrameId}
                        list={dataSourceOptions}
                        label={portName}
                        hiddenNoSelect={false}
                        {...actionProps}
          ></DropDownList>

        </div>
        inEdgeSelect.push(item)
      })
    }
    const SortableItem = SortableElement(({value}) => <li>{value}</li>);

    const SortableList = SortableContainer(({items}) => {
    return (
        <ul className="inPorts">
          {items.map((value, index) => (
            <SortableItem key={`item-${index}`} index={index} value={value} />
          ))}
        </ul>
      );
    });

     

    const subflow = selectedStep.getCommand()
    const subflowOutPorts = subflow.getOutPorts()
    const output = Object.keys(selectedStep.dsts).map((key,index)=>{
      let dataFrameId: string
      dataFrameId = selectedStep.dsts[key]
      const node = FlowUtil.getNodeFromID(nodes,dataFrameId)
      const subflowOutPort = subflowOutPorts.find((outPort) => {
        return (outPort.nodeId == key)
      })
      return <div key={index} className={style.outPort_}>
        <div className={style.outPort_Port}>
          {(subflowOutPort) ? subflowOutPort.label : null}
        </div>
        <div className={style.outPort_Node}>
          {node.getLabel()}
        </div>
      </div>
    })

    return  <div className="kskp-form">
          <label>入力</label>
          <SortableList items={inEdgeSelect} onSortEnd={this.props.sortStepSrcEnd}/>
          {addEdgeContainer}
          <label>出力</label>
          {output}
        </div>
  }

}

export default InOutConnector