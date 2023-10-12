import React from 'react';
import style from '../style.scss';
import Constants from 'Constants/index';
import {DropDownList} from 'Shared/Input';
import {FlowUtil, ModalUtil, StateUtil} from 'Utils/index';
import { CommandNodeType, FlowNodeType, FrameNodeType, InlineFlowNodeType } from 'Model/Step/NodeTypes';
import { AllNodeType } from 'Model/Library';
import { RunnablesType } from 'Types/index';

type Props = {
    portLabel: string;
    index: number;
    nodes: AllNodeType[];
    runnables: RunnablesType;
    selectedStep: CommandNodeType | FlowNodeType | InlineFlowNodeType;
    updateNodeEdges: (node: AllNodeType) => void;
    disabled: boolean;
};

/**
 * 入力ポートコネクタ
 * @param props 
 * @returns 
 */
export const InConnector = (props: Props) => {
    const {portLabel, index, nodes, runnables, selectedStep, updateNodeEdges, disabled} = props;

    const nodeSrcs = selectedStep?.srcs || {};
    const nodeId = nodeSrcs[portLabel] || '';

    const dataSourceOptions = FlowUtil.getAllDataFrame(nodes).map(dataFrame => ({
        value: dataFrame.id,
        label: dataFrame.label || '',
        object: dataFrame
    }));

    const onChangeInEdge = (e, data, label) => {
        // let newStep = StateUtil.deepCopy(selectedStep);
        const newStep = selectedStep.clone<CommandNodeType>(selectedStep.id);
        //labelにポート名
        //data.objectにデータフレームが格納されている
        if (data.object) {
            //ノードが選択されたとき
            const dataSource: FrameNodeType = data.object;
            if(!newStep.srcs){
                newStep.srcs = {};
            }
            newStep.srcs[label] = dataSource.id;
            updateNodeEdges(newStep);
        } else {
            //「選択してください」が選択されたときはノードのつながりを削除する
            newStep.srcs && delete newStep.srcs[label];
            updateNodeEdges(newStep);
        }
    };

    const deletePort = (step:CommandNodeType, portLabel:string) => {
        // FIXME:
        // dispatch(updateStepAction(step, zoom)) の処理ではStateと入力Nodeのsrcsに差異がある場合に限りCanvasのエッジ描画に反映させる
        // そのため、Stateが参照するNodeではなくこれを複製して、iPortを削除したものを渡す必要がある
        // 複製したNodeのdeleteinPort関数は複製元のiPortを削除するので、複製したNodeのinPortを削除するためのdeleteInPort関数を用意する
        const deleteInPort = (step:CommandNodeType, label:string) => {
            step.srcs && delete step.srcs[label];
            if(step.srcsOrder){
                step.srcsOrder = step.srcsOrder.filter(srcLabel => srcLabel !== label);
            }
        };

        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                // const newStep:CommandNodeType = StateUtil.deepCopy(step);

                // updateNodeEdges()から呼び出されるrebuildNodesEdges()が機能するためには
                // flow.nodesが含むNodeとは別のNodeオブジェクトを渡す必要がある
                const newStep = step.clone<CommandNodeType>(step.id);
                deleteInPort(newStep, portLabel);
                updateNodeEdges(newStep);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: '削除する',
            danger: true,
            content: <div>
                {portLabel} の入力を削除しますか？
            </div>
        });
    };

    const actionProps = (node:CommandNodeType | FlowNodeType | InlineFlowNodeType) => {
        if(node.type === 'command'){
            const commandNode = node as CommandNodeType;
            const command = runnables.commands.getCommand(commandNode.commandId);
            if(command && commandNode.addableInPort(command)){
                return {
                    actionLabel: '削除',
                    onClickAction: () => deletePort(commandNode, portLabel)
                }
            }
        }
        return null;
    };

    return <li>
        <div key={index} className={style.param}>
            <DropDownList
                key={'in_edge'}
                label={portLabel}
                list={dataSourceOptions}
                value={nodeId}
                hiddenNoSelect={false}
                disabled={disabled}
                onChange={(e, data, label) => onChangeInEdge(e, data, label)}
                {...actionProps(selectedStep)}
            />
        </div>
    </li>;
};
