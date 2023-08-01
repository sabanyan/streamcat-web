//@flow
import React from 'react';
import {BaseInspector} from 'Shared/Inspector';
import {Button} from 'Shared/Input';
import {CommandSelector} from 'FlowEditorContainer/Command';
import {CommandStepModel, DataFrameStepModel, SubFlowStepModel} from 'Model/index';
import {GraphUtil, ModalUtil} from 'Utils/index';
import Constants from 'Constants/index';
import { RunnablesType, StepModelType } from 'Types/index';

type Props = {
    deleteSteps: (step_ids: string[]) => void;
    selectSteps: (selected_steps: any[]) => void;
    nodes: any[];
    runnables: RunnablesType;
    selectedStepIds: string[];
    zoom: number;
    addStep: (add_step:StepModelType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => void;
    addDataSrcStep: Function;
    addDataDstStep: Function;
    addHistory: Function;
    baseInspectorDisabled: boolean;
    commandSelectorHidden: boolean;
}

const MultiInspector = (props: Props) => {
    const onClickDelete = () => {
        const {deleteSteps, selectSteps} = props;
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM,
            onClickDone: () => {
                const {selectedStepIds} = props;
                deleteSteps(selectedStepIds);
                selectSteps([]);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: '削除する',
            danger: true,
            content: <div>
                選択されたステップを削除しますか？
            </div>
        });
    };

    const getNumberOfSelectedDataSources = () => {
        const {nodes, selectedStepIds} = props;
        let cnt = 0;
        let hasMixedCommand = false; //コマンドが混ざって選択されている場合
        selectedStepIds.forEach((id) => {
            const node = GraphUtil.getNode(nodes, id);
            if (node.type === 'frame') {
                cnt++;
            } else if (node instanceof SubFlowStepModel) {
                hasMixedCommand = true;
            } else if (node.type === 'command') {
                hasMixedCommand = true;
            }
        });
        if (hasMixedCommand) return 0;
        return cnt;
    };

    const {runnables, selectedStepIds, zoom, addStep, addDataSrcStep, addDataDstStep,
           selectSteps, addHistory, baseInspectorDisabled, commandSelectorHidden} = props;
    const numberOfSelectedDataSources = getNumberOfSelectedDataSources();

    let commandSelector;
    if (numberOfSelectedDataSources) {
        commandSelector = <div>
            <CommandSelector
                // nodes={nodes}
                runnables={runnables}
                numberOfInput={numberOfSelectedDataSources}
                selectedStepIds={selectedStepIds}
                zoom={zoom}
                addStep={addStep}
                addDataSrcStep={addDataSrcStep}
                addDataDstStep={addDataDstStep}
                selectSteps={selectSteps}
                addHistory={addHistory} />
        </div>;
    }

    if (commandSelectorHidden) {
        // コマンドセレクタ非表示の扱いの場合は表示しない
        commandSelector = null;
    }

    return <BaseInspector key={JSON.stringify(selectedStepIds)}
                          header={''}
                          title={selectedStepIds.length + ' files'}
                          disabled={baseInspectorDisabled}>
        <div className='streamcat-form'>
            <Button onClick={() => onClickDelete()} danger={true} disabled={baseInspectorDisabled}>
                削除する
            </Button>
        </div>
        {commandSelector}
    </BaseInspector>;
};

export {MultiInspector};

