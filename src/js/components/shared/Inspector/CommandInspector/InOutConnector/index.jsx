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
import AddButton from '../../../AddButton'
import {SortableContainer, SortableElement} from 'react-sortable-hoc';

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

      addEdgeContainer = <AddButton onClick={()=>this.onClickAddEdge(selectedStep)}>入力を追加する</AddButton>
      selectedStep.srcsOrder.forEach((key, index) => {

        let dataFrameId: string
        dataFrameId = selectedStep.srcs[key]
        let portName = key

        const actionProps = {
          actionLabel:"削除",
          onClickAction:()=>this.deletePort(selectedStep,portName)
        }

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

     



    const output = Object.keys(selectedStep.dsts).map((key,index)=>{
      let dataFrameId: string
      dataFrameId = selectedStep.dsts[key]
      const node = FlowUtil.getNodeFromID(nodes,dataFrameId)
      return <div key={index} className={style.output}>{node.getLabel()}</div>
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