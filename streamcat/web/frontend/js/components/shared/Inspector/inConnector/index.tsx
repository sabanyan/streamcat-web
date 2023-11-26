import React from 'react';
import style from '../style.scss';
import Constants from 'Constants/index';
import {DropDownList} from 'Shared/Input';
import {ModalUtil} from 'Utils/index';
import { CommandNodeType, FlowNodeType, FrameNodeType, InlineFlowNodeType } from 'Model/Node/NodeTypes';
import { AllNodeType } from 'Model/Library';
import { RunnablesType } from 'Types/index';
import { addNodeEdges, removeNodeEdge } from 'Modules/flowEditor';

type Props = {
    portLabel: string;
    index: number;
    nodes: AllNodeType[];
    runnables: RunnablesType;
    selectedNode: CommandNodeType | FlowNodeType | InlineFlowNodeType;
    updateNode: (updatedNode: AllNodeType) => void;
    // updateNodeEdges: (node: AllNodeType) => void;
    disabled: boolean;
};

/**
 * 入力ポートコネクタ
 * @param props 
 * @returns 
 */
export const InConnector = (props: Props) => {
    const {portLabel, index, nodes, runnables, selectedNode, updateNode, disabled} = props;

    const nodeSrcs = selectedNode?.srcs || {};
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
            removeNodeEdge(selectedNode, portLabel);
            // NodeのPortを変更する
            if(!selectedNode.srcs){
                selectedNode.srcs = {};
            }
            selectedNode.srcs[portLabel] = srcNode.id;
            // Canvasに対象のEdgeを追加する
            addNodeEdges(selectedNode);
            // Flowオブジェクトに反映する
            updateNode(selectedNode);
        } else {
            // Canvasから対象のEdgeを削除する
            removeNodeEdge(selectedNode, portLabel);
            //「選択してください」が選択されたときはノードのつながりを削除する
            if(selectedNode.srcs){
                selectedNode.srcs[portLabel] = '';
            }
            // Flowオブジェクトに反映する
            updateNode(selectedNode);
        }
    };

    const deletePort = (node:CommandNodeType, portLabel:string) => {
        // FIXME:
        // dispatch(updateNodeAction(node, zoom)) の処理ではStateと入力Nodeのsrcsに差異がある場合に限りCanvasのエッジ描画に反映させる
        // そのため、Stateが参照するNodeではなくこれを複製して、iPortを削除したものを渡す必要がある
        // 複製したNodeのdeleteinPort関数は複製元のiPortを削除するので、複製したNodeのinPortを削除するためのdeleteInPort関数を用意する
        const deleteInPort = (node:CommandNodeType, label:string) => {
            node.srcs && delete node.srcs[label];
            if(node.srcsOrder){
                node.srcsOrder = node.srcsOrder.filter(srcLabel => srcLabel !== label);
            }
        };

        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                // Canvasから対象のEdgeを削除する
                removeNodeEdge(node, portLabel);
                // NodeからPortを削除する
                deleteInPort(node, portLabel);
                // Flowオブジェクトに反映する
                updateNode(node);
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
                {...actionProps(selectedNode)}
            />
        </div>
    </li>;
};
