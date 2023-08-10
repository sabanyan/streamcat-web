import React from 'react';
import style from "../style.scss";
import {AddButton} from "Shared/Input";
import {FlowUtil, ModalUtil} from "Utils/index";
import Constants from "Constants/index";
import { InConnector } from '../inConnector';
import { CommandNodeType, addInPort } from 'Model/Step/NodeTypes';
import { AllNodeType } from 'Model/Library';

type Props = {
    // TODO: 型指定をしたいがエラーになる箇所があるので保留する
    // selectedStep: SubFlowStepModel | CommandStepModel;
    selectedStep: any;
    updateStep: (step: AllNodeType) => void;
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
    if (selectedStep.type === 'flow' && selectedStep.classification === 'data_dest') { // datadst
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
    } else if (selectedStep.type === 'flow' || selectedStep.type === 'command') {
        // サブフローまたはコマンドの場合
        portlabels = selectedStep.srcsOrder;
    }

    const inConnectors = portlabels.map((portLabel, index) =>
        <InConnector
            key={index}
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

    if (selectedStep.type === 'flow' && selectedStep.classification === 'data_source') {
        outConnectors = Object.keys(selectedStep.dsts).map((key, index) => {
            let dataFrameId: string = selectedStep.dsts[key]
            const node = FlowUtil.getNodeFromID(nodes, dataFrameId)
            if(!node){
                return <></>;
            }
            return <div key={index} className={style.outPort_}>
                <div className={style.outPort_Port}>
                    {key}
                </div>
                <div className={style.outPort_Node}>
                    {node.label}
                </div>
            </div>;
        });
    } else if (selectedStep.type === 'flow') {
        const subflow = selectedStep.getCommand && selectedStep.getCommand();
        if (subflow) {
            const subflowOutPorts = subflow.ports[1];
            outConnectors = Object.keys(selectedStep.dsts).map((key, index) => {
                let dataFrameId: string;
                dataFrameId = selectedStep.dsts[key];
                const node = FlowUtil.getNodeFromID(nodes, dataFrameId);
                const subflowOutPort = subflowOutPorts.find((outPort) => {
                    return (outPort.label == key);
                });
                if(!node){
                    return <></>;
                }
                return <div key={index} className={style.outPort_}>
                    <div className={style.outPort_Port}>
                        {(subflowOutPort) ? subflowOutPort.label : null}
                    </div>
                    <div className={style.outPort_Node}>
                        {node.label}
                    </div>
                </div>;
            });
        }
    } else if (selectedStep.type === 'command') {
        const commandStep = selectedStep;
        const commandStepDsts = commandStep.dsts;
        outConnectors = Object.keys(commandStepDsts).map((key, index) => {
            let dataFrameId: string;
            dataFrameId = commandStepDsts[key];
            const node = FlowUtil.getNodeFromID(nodes, dataFrameId);
            if(!node){
                return <></>;
            }
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

    const onClickAddEdge = (step:CommandNodeType) => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const nextIndex = step.getInPortIndex() + 1;
                // const newStep:CommandNodeType = StateUtil.deepCopy(step);
                const newStep:CommandNodeType = {...step, srcs:{...step.srcs}, srcsOrder:[...(step.srcsOrder || [])]};
                addInPort(newStep, '*' + nextIndex, '');
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
