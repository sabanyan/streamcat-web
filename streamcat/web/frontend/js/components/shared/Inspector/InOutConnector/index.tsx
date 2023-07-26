import React from 'react';
import style from "../style.scss";
import {AddButton} from "Shared/Input";
import {CommandStepModel, SubFlowStepModel} from "Model/index";
import {FlowUtil, ModalUtil, StateUtil} from "Utils/index";
import Constants from "Constants/index";
import { InConnector } from '../inConnector';

type Props = {
    // TODO: 型指定をしたいがエラーになる箇所があるので保留する
    // selectedStep: SubFlowStepModel | CommandStepModel;
    selectedStep: any;
    updateStep: Function;
    nodes: any[];
    // FIXIT: 使用していないプロパティ?
    // selectedSubFlow: FlowModel | null;
    disabled?: boolean;
}

export const InOutConnector = (props: Props) => {
    const {nodes, selectedStep, updateStep, disabled} = props;
    
    // 
    // 入力コネクタリストを作成する
    // 
    let portlabels: string[] = [];
    if (selectedStep instanceof SubFlowStepModel || selectedStep instanceof CommandStepModel) {
        // サブフローまたはコマンドの場合
        portlabels = selectedStep.srcsOrder;
    } else if (selectedStep.srcs && selectedStep.flow) { // for datasource & datadst
        // データデストの場合は何故かsrcsOrderに値が格納されていないので
        // srcsプロパティから入力ポートを取得する
        portlabels = Object.entries(selectedStep.srcs).map(src => {
            const portLabel = src[0]
            // NOTE: サブフローの変更によってポートが減った場合に備えている?
            if(selectedStep.flow.ports[0].find(port => port.label===portLabel)){
                return portLabel;
            }else{
                return '';
            }
        });
    }

    const inConnectors = portlabels.map((portLabel, index) =>
        <InConnector
            portLabel={portLabel}
            index={index}
            nodes={nodes}
            selectedStep={selectedStep}
            updateStep={updateStep}
            disabled={!!disabled}
        />
    );

    // 
    // 出力コネクタリストを作成する
    // 
    let outConnectors: React.ReactNode[] = [];
    if (selectedStep instanceof SubFlowStepModel) {
        const subflow = selectedStep.getCommand();
        if (subflow) {
            const subflowOutPorts = subflow.getOutPorts();
            outConnectors = Object.keys(selectedStep.dsts).map((key, index) => {
                let dataFrameId: string;
                dataFrameId = selectedStep.dsts[key];
                const node = FlowUtil.getNodeFromID(nodes, dataFrameId);
                const subflowOutPort = subflowOutPorts.find((outPort) => {
                    return (outPort.label == key);
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
        }
    } else if (selectedStep instanceof CommandStepModel) {
        const commandStep = selectedStep;
        const commandStepDsts = commandStep.dsts;
        outConnectors = Object.keys(commandStepDsts).map((key, index) => {
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
    } else if(selectedStep.dsts) {
        outConnectors = Object.keys(selectedStep.dsts).map((key, index) => {
            let dataFrameId: string = selectedStep.dsts[key]
            const node = FlowUtil.getNodeFromID(nodes, dataFrameId)
            return <div key={index} className={style.outPort_}>
                <div className={style.outPort_Port}>
                    {key}
                </div>
                <div className={style.outPort_Node}>
                    {node.label}
                </div>
            </div>;
        });
    }

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

    const addEdgeContainer = selectedStep.addableInPort()?
        <AddButton onClick={() => onClickAddEdge(selectedStep)}>入力を追加する</AddButton>:
        null;

    // FIXIT: React Hooks対応の後に、className={'streamcat-form'}が出力されない、classnamesの不具合?
    // https://github.com/JedWatson/classnames/issues/115
    return <div className={'streamcat-form'}>
        <label>入力</label>
        <ul className="inPorts" >{inConnectors}</ul>
        {addEdgeContainer}
        <label>出力</label>
        {outConnectors}
    </div>;
};
