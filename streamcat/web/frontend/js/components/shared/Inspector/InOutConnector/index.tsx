import React from 'react';
import style from '../style.scss';
import {AddButton} from 'Shared/Input';
import {FlowUtil, ModalUtil, StateUtil} from 'Utils/index';
import Constants from 'Constants/index';
import { InConnector } from '../inConnector';
import { CommandNodeType, FlowNodeType, InlineFlowNodeType, addInPort } from 'Model/Step/NodeTypes';
import { AllNodeType } from 'Model/Library';
import { RunnablesType } from 'Types/index';

type Props = {
    // TODO: 型指定をしたいがエラーになる箇所があるので保留する
    // selectedStep: SubFlowStepModel | CommandStepModel;
    selectedStep: CommandNodeType | FlowNodeType | InlineFlowNodeType;
    updateNodeEdges: (node: AllNodeType) => void;
    nodes: AllNodeType[];
    runnables: RunnablesType;
    // FIXIT: 使用していないプロパティ?
    // selectedSubFlow: FlowModel | null;
    disabled?: boolean;
}

export const InOutConnector = (props: Props) => {
    const {nodes, runnables, selectedStep, updateNodeEdges, disabled} = props;
    
    // 
    // 入力コネクタリストを作成する
    // 
    let portlabels: string[] = [];
    if (selectedStep.type === 'flow'){
        const flowNode = selectedStep as FlowNodeType | InlineFlowNodeType;
        
        if(flowNode.classification === 'data_dest') { // datadst
            // データデストの場合は何故かsrcsOrderに値が格納されていないので
            // srcsプロパティから入力ポートを取得する
            portlabels = Object.entries(flowNode.srcs || {}).map(src => {
                const portLabel = src[0];
                // NOTE: サブフローの変更によってポートが減った場合に備えている?
                if(flowNode.hasOwnProperty('flow') && (flowNode as InlineFlowNodeType).flow.ports[0].find(port => port.label===portLabel)){
                    return portLabel;
                }else{
                    return '';
                }
            });
        }else{
            portlabels = flowNode.srcsOrder || [];
        }
    } else if (selectedStep.type === 'command') {
        // コマンドの場合
        portlabels = selectedStep.srcsOrder || [];
    }

    const inConnectors = portlabels.map((portLabel, index) =>
        <InConnector
            key={index}
            portLabel={portLabel}
            index={index}
            nodes={nodes}
            runnables={runnables}
            selectedStep={selectedStep}
            updateNodeEdges={updateNodeEdges}
            disabled={!!disabled}
        />
    );

    // 
    // 出力コネクタリストを作成する
    // 
    let outConnectors: React.ReactNode[] = [];

    if (selectedStep.type === 'flow') {
        const flowNode = selectedStep as FlowNodeType | InlineFlowNodeType;
        
        if(flowNode.classification === 'data_source') {
            const commandStepDsts = flowNode.dsts || {};
            outConnectors = Object.keys(commandStepDsts).map((key, index) => {
                let dataFrameId: string = commandStepDsts[key]
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

        }else{
            const flowCommand = flowNode.hasOwnProperty('getCommand') && runnables.subflows.getCommand((flowNode as FlowNodeType).uuid);
            if (flowCommand) {
                const commandStepDsts = flowNode.dsts || {};
                const subflowOutPorts = flowCommand.ports[1];
                outConnectors = Object.keys(commandStepDsts).map((key, index) => {
                    let dataFrameId: string;
                    dataFrameId = commandStepDsts[key];
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
        }
    } else if (selectedStep.type === 'command') {
        const commandStep = selectedStep;
        const commandStepDsts = commandStep.dsts || {};
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
                const newStep = step.clone<CommandNodeType>(step.id);
                addInPort(newStep, '*' + nextIndex, '');
                updateNodeEdges(newStep);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: '追加する',
            content: <div>
                入力を追加しますか？
            </div>
        });
    };

    const addEdgeContainer = (node:CommandNodeType | FlowNodeType | InlineFlowNodeType) => {
        if(node.type === 'command'){
            const commandNode = node as CommandNodeType;
            const command = runnables.commands.getCommand(commandNode.commandId);
            if(command && commandNode.addableInPort(command)){
                return <AddButton onClick={() => onClickAddEdge(commandNode)}>入力を追加する</AddButton>;
            }
        }
        return <></>;
    };

    // FIXIT: React Hooks対応の後に、className={'streamcat-form'}が出力されない、classnamesの不具合?
    // https://github.com/JedWatson/classnames/issues/115
    return <div className={'streamcat-form'}>
        <label>入力</label>
        <ul className='inPorts' >{inConnectors}</ul>
        {addEdgeContainer(selectedStep)}
        <label>出力</label>
        {outConnectors}
    </div>;
};
