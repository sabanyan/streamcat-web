import React from 'react';
import style from '../style.scss';
import Constants from 'Constants/index';
import {DropDownList} from 'Shared/Input';
import {ModalUtil} from 'Utils/index';
import { CommandNodeType, FlowNodeType, FrameNodeType, InlineFlowNodeType } from 'Model/Step/NodeTypes';
import { AllNodeType } from 'Model/Library';
import { RunnablesType } from 'Types/index';
import { addNodeEdges, removeNodeEdge } from 'Modules/flowEditor';

type Props = {
    portLabel: string;
    index: number;
    nodes: AllNodeType[];
    runnables: RunnablesType;
    selectedStep: CommandNodeType | FlowNodeType | InlineFlowNodeType;
    updateStep: (updatedNode: AllNodeType) => void;
    // updateNodeEdges: (node: AllNodeType) => void;
    disabled: boolean;
};

/**
 * 入力ポートコネクタ
 * @param props 
 * @returns 
 */
export const InConnector = (props: Props) => {
    const {portLabel, index, nodes, runnables, selectedStep, updateStep, disabled} = props;

    const nodeSrcs = selectedStep?.srcs || {};
    const nodeId = nodeSrcs[portLabel] || '';

    const dataSourceOptions = nodes.filter(node => node.type==='frame').map(dataFrame => ({
        value: dataFrame.id,
        label: dataFrame.label || '',
        object: dataFrame
    }));

    const onChangeInEdge = (e, data, portLabel) => {
        // data.objectにデータフレームが格納されている
        const srcNode: FrameNodeType = data.object;
        if (srcNode) {
            // Canvasから対象のEdgeを削除する
            removeNodeEdge(selectedStep, portLabel);
            // NodeのPortを変更する
            if(!selectedStep.srcs){
                selectedStep.srcs = {};
            }
            selectedStep.srcs[portLabel] = srcNode.id;
            // Canvasに対象のEdgeを追加する
            addNodeEdges(selectedStep);
            // Flowオブジェクトに反映する
            updateStep(selectedStep);
        } else {
            // Canvasから対象のEdgeを削除する
            removeNodeEdge(selectedStep, portLabel);
            //「選択してください」が選択されたときはノードのつながりを削除する
            if(selectedStep.srcs){
                selectedStep.srcs[portLabel] = '';
            }
            // Flowオブジェクトに反映する
            updateStep(selectedStep);
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
                // Canvasから対象のEdgeを削除する
                removeNodeEdge(step, portLabel);
                // NodeからPortを削除する
                deleteInPort(step, portLabel);
                // Flowオブジェクトに反映する
                updateStep(step);
                // ダイアログを閉じる
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
