//@flow
import React from 'react';
import {BaseInspector} from 'Shared/Inspector';
import {Button} from 'Shared/Input';
import {CommandSelector} from 'FlowEditorContainer/Command';
import {ModalUtil} from 'Utils/index';
import Constants from 'Constants/index';
import { RunnablesType } from 'Types/index';
import { AllNodeType, Command, FlowCommand, InlineFlowCommand } from 'Model/Library';

type Props = {
    deleteNodes: (nodes: AllNodeType[]) => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    nodes: AllNodeType[];
    runnables: RunnablesType;
    selectedNodes: AllNodeType[];
    zoom: number;
    addNode: (addNode:AllNodeType, srcNodes:AllNodeType[], dstNodes:AllNodeType[], zoom:number) => void;
    addDataSrcNode: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstNode: (command:Command | FlowCommand | InlineFlowCommand, selectedNodeId:string) => void;
    addHistory: () => void;
    baseInspectorDisabled: boolean;
    commandSelectorHidden: boolean;
};

export const MultiInspector = (props: Props) => {
    const onClickDelete = () => {
        const {deleteNodes, selectNodes} = props;
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM,
            onClickDone: () => {
                const {selectedNodes} = props;
                deleteNodes(selectedNodes);
                selectNodes([]);
                addHistory();
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: '削除する',
            danger: true,
            content: <div>
                選択されたノードを削除しますか？
            </div>
        });
    };

    const {runnables, selectedNodes, zoom, nodes, addNode, addDataSrcNode, addDataDstNode,
        selectNodes, addHistory, baseInspectorDisabled, commandSelectorHidden} = props;

    const getNumberOfSelectedDataSources = () => {
        let cnt = 0;
        let hasMixedCommand = false; //コマンドが混ざって選択されている場合
        selectedNodes.forEach(selectNode => {
            if (selectNode.type === 'frame') {
                cnt++;
            } else if (selectNode.type === 'flow') {
                hasMixedCommand = true;
            } else if (selectNode.type === 'command') {
                hasMixedCommand = true;
            }
        });
        if (hasMixedCommand) return 0;
        return cnt;
    };

    const numberOfSelectedDataSources = getNumberOfSelectedDataSources();

    let commandSelector;
    if (numberOfSelectedDataSources) {
        commandSelector = <div>
            <CommandSelector
                nodes={nodes}
                runnables={runnables}
                numberOfInput={numberOfSelectedDataSources}
                selectedNodes={selectedNodes}
                zoom={zoom}
                addNode={addNode}
                addDataSrcNode={addDataSrcNode}
                addDataDstNode={addDataDstNode}
                selectNodes={selectNodes}
                addHistory={addHistory} />
        </div>;
    }

    if (commandSelectorHidden) {
        // コマンドセレクタ非表示の扱いの場合は表示しない
        commandSelector = null;
    }

    return <BaseInspector key={JSON.stringify(selectedNodes)}
                          title={selectedNodes.length + ' files'}
                          disabled={baseInspectorDisabled}>
        <div className='streamcat-form'>
            <Button onClick={() => onClickDelete()} danger={true} disabled={baseInspectorDisabled}>
                削除する
            </Button>
        </div>
        {commandSelector}
    </BaseInspector>;
};
