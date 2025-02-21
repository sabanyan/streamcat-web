import React from 'react';
import * as style from '../style.scss';
import {AddButton} from 'Shared/Input';
import {ModalUtil} from 'Utils/index';
import { Constants } from 'Constants/index';
import { InConnector } from '../inConnector';
import { CommandNodeType, FlowNodeType, InlineFlowNodeType, addInPort } from 'Model/Node/NodeTypes';
import { AllNodeType } from 'Model/Library';
import { RunnablesType } from 'Types/index';

type Props = {
    selectedNode: CommandNodeType | FlowNodeType | InlineFlowNodeType;
    updateNode: (updatedNode: AllNodeType) => void;
    // updateNodeEdges: (node: AllNodeType) => void;
    nodes: AllNodeType[];
    runnables: RunnablesType;
    // FIXIT: 使用していないプロパティ?
    // selectedSubFlow: FlowModel | null;
    disabled?: boolean;
}

export const InOutConnector = (props: Props) => {
    const {nodes, runnables, selectedNode, updateNode, disabled} = props;
    
    // 
    // 入力コネクタリストを作成する
    // 
    let portlabels: string[] = [];
    if (selectedNode.type === 'flow'){
        const flowNode = selectedNode as FlowNodeType | InlineFlowNodeType;
        
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
    } else if (selectedNode.type === 'command') {
        // コマンドの場合
        portlabels = selectedNode.srcsOrder || [];
    }

    const inConnectors = portlabels.map((portLabel, index) =>
        <InConnector
            key={index}
            portLabel={portLabel}
            index={index}
            nodes={nodes}
            runnables={runnables}
            selectedNode={selectedNode}
            updateNode={updateNode}
            // updateNodeEdges={updateNodeEdges}
            disabled={!!disabled}
        />
    );

    // 
    // 出力コネクタリストを作成する
    // 
    let outConnectors: React.ReactNode[] = [];

    if (selectedNode.type === 'flow') {
        const flowNode = selectedNode as FlowNodeType | InlineFlowNodeType;
        
        if(flowNode.classification === 'data_source') {
            const commandNodeDsts = flowNode.dsts || {};
            outConnectors = Object.keys(commandNodeDsts).map((key, index) => {
                const dataFrameId: string = commandNodeDsts[key];
                const node = nodes.find(node => node.id===dataFrameId);
                if(!node){
                    // Reactからのkey重複警告を抑止するためkeyを指定する必要がある
                    // そのため、空タグ(<></>)の代わりにReact.Fragmentタグを用いる
                    return <React.Fragment key={index} />;
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
                const commandNodeDsts = flowNode.dsts || {};
                const subflowOutPorts = flowCommand.ports[1];
                outConnectors = Object.keys(commandNodeDsts).map((key, index) => {
                    const dataFrameId = commandNodeDsts[key];
                    const node = nodes.find(node => node.id===dataFrameId);
                    const subflowOutPort = subflowOutPorts.find((outPort) => {
                        return (outPort.label == key);
                    });
                    if(!node){
                        return <React.Fragment key={index} />;
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
    } else if (selectedNode.type === 'command') {
        const commandNode = selectedNode;
        const commandNodeDsts = commandNode.dsts || {};
        outConnectors = Object.keys(commandNodeDsts).map((key, index) => {
            const dataFrameId = commandNodeDsts[key];
            const node = nodes.find(node => node.id===dataFrameId);
            if(!node){
                return <React.Fragment key={index} />;
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

    const onClickAddEdge = (node:CommandNodeType) => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const nextIndex = node.getInPortIndex() + 1;
                // NodeにPortを新規追加する
                addInPort(node, '*' + nextIndex, '');
                // Flowオブジェクトに反映する
                updateNode(node);
                // ダイアログを閉じる
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
        {addEdgeContainer(selectedNode)}
        <label>出力</label>
        {outConnectors}
    </div>;
};
