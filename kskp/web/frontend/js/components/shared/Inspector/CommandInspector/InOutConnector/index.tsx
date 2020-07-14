import * as React from "react";
import style from "../../style.scss";
import {AddButton, DropDownList} from "Shared/Input";
import {CommandStepModel, DataFrameStepModel, FlowModel, SubFlowStepModel} from "Model/index";
import {FlowUtil, ModalUtil, StateUtil} from "Utils/index";
import Constants from "Constants/index";
import {SortableContainer, SortableElement} from "react-sortable-hoc";
import {StepModelType} from "Types/index";

type Props = {
    selectedStep: SubFlowStepModel | CommandStepModel;
    updateStep: Function;
    nodes: [];
    sortStepSrcEnd: Function;
    onChangeInEdge: Function;
    onChangeOutEdge: Function;
    selectedSubFlow: FlowModel;
    disabled?: boolean;
}

const InOutConnector = (props: Props) => {

    const onChangeInEdge = (e, data, label) => {
        const {selectedStep, updateStep} = props;
        let newSelectedStep = StateUtil.deepCopy(selectedStep);
        //labelにポート名
        //data.objectにデータフレームが格納されている
        if (data.object) {
            //ノードが選択されたとき
            const dataSource: DataFrameStepModel = data.object;
            newSelectedStep.srcs[label] = dataSource.id;
            updateStep(newSelectedStep);
        } else {
            //「選択してください」が選択されたときはノードのつながりを削除する
            newSelectedStep.srcs[label] = null;
            updateStep(newSelectedStep);
        }
    };

    const onClickAddEdge = (step) => {
        const {updateStep} = props;
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const nextIndex = step.getInPortIndex() + 1;
                const newStep = StateUtil.deepCopy(step);
                newStep.addInPort("*" + nextIndex);
                updateStep(newStep);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "追加する",
            content: <div>
                入力を追加しますか？
            </div>
        });
    };

    const deletePort = (step: StepModelType, portName: string) => {
        const {updateStep} = props;
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const newStep = StateUtil.deepCopy(step);
                newStep.deleteInPort(portName);
                updateStep(newStep);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "削除する",
            danger: true,
            content: <div>
                {portName} の入力を削除しますか？
            </div>
        });
    };

    const {nodes, selectedStep, disabled} = props;
    //すべてのデータフレーム先をリスト化

    let dataFrameOnlyNodes: [DataFrameStepModel] = FlowUtil.getAllDataFrame(nodes);

    let dataSourceOptions: { value: string | null | undefined, label: string | null | undefined, object: DataFrameStepModel }[] = [];

    dataFrameOnlyNodes.forEach((dataFrame) => {
        dataSourceOptions.push({value: dataFrame.id, label: dataFrame.getLabel(), object: dataFrame});
    });

    let inEdgeSelect: React.ReactNode[] = [];
    let addEdgeContainer;
    if (selectedStep instanceof SubFlowStepModel || selectedStep instanceof CommandStepModel) {

        addEdgeContainer = (selectedStep.addableInPort()) ?
            <AddButton onClick={() => onClickAddEdge(selectedStep)}>入力を追加する</AddButton> : null;
        selectedStep.srcsOrder.forEach((key, index) => {

            let dataFrameId: string;
            dataFrameId = selectedStep.srcs[key];
            let portName = key;

            const actionProps = (selectedStep.addableInPort()) ? {
                actionLabel: "削除",
                onClickAction: () => deletePort(selectedStep, portName)
            } : null;

            const item = <div key={index} className={style.param}>
                <DropDownList disabled={disabled}
                              key={"in_edge"}
                              onChange={(e, data, label) => onChangeInEdge(e, data, label)}
                              defaultValue={dataFrameId}
                              list={dataSourceOptions}
                              label={portName}
                              hiddenNoSelect={false}
                              {...actionProps}
                />

            </div>;
            inEdgeSelect.push(item);
        });
    }
    const {sortStepSrcEnd} = props;
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


    let output: React.ReactNode = null;
    if (selectedStep instanceof SubFlowStepModel) {
        const subflow = selectedStep.getCommand();
        const subflowOutPorts = subflow.getOutPorts();
        output = Object.keys(selectedStep.dsts).map((key, index) => {
            let dataFrameId: string;
            dataFrameId = selectedStep.dsts[key];
            const node = FlowUtil.getNodeFromID(nodes, dataFrameId);
            const subflowOutPort = subflowOutPorts.find((outPort) => {
                return (outPort.nodeId == key);
            });
            return <div key={index} className={style.outPort_}>
                <div className={style.outPort_Port}>
                    {(subflowOutPort) ? subflowOutPort.label : null}
                </div>
                <div className={style.outPort_Node}>
                    {node.getLabel()}
                </div>
            </div>;
        });
    } else if (selectedStep instanceof CommandStepModel) {
        const commandStep = selectedStep;
        const commandStepDsts = commandStep.dsts;
        output = Object.keys(commandStepDsts).map((key, index) => {
            let dataFrameId: string;
            dataFrameId = commandStepDsts[key];
            const node = FlowUtil.getNodeFromID(nodes, dataFrameId);
            return <div key={index} className={style.outPort_}>
                <div className={style.outPort_Port}>
                    {key}
                </div>
                <div className={style.outPort_Node}>
                    {node.getLabel()}
                </div>
            </div>;
        });
    }


    return <div className="kskp-form">
        <label>入力</label>
        <SortableList items={inEdgeSelect} onSortEnd={sortStepSrcEnd} distance={1} />
        {addEdgeContainer}
        <label>出力</label>
        {output}
    </div>;
};


export {InOutConnector};
