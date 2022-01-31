//@flow
import React from 'react';
import {BaseInspector} from 'Shared/Inspector';
import {Button} from 'Shared/Input';
import {CommandSelector} from 'FlowEditorContainer/Command';
import {CommandStepModel, DataFrameStepModel, SubFlowStepModel} from 'Model/index';
import {GraphUtil, ModalUtil} from 'Utils/index';
import Constants from 'Constants/index';
import {flowEditorReducerInitialState} from 'Modules/flowEditor';

type Props = {
    deleteSteps: Function;
    selectSteps: Function;
    nodes: any[];
    mast: typeof flowEditorReducerInitialState.mast;
    selected_step_ids: string[];
    addStep: Function;
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
                const {selected_step_ids} = props;
                deleteSteps(selected_step_ids);
                selectSteps();
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
        const {nodes, selected_step_ids} = props;
        let cnt = 0;
        let hasMixedCommand = false; //コマンドが混ざって選択されている場合
        selected_step_ids.forEach((id) => {
            const node = GraphUtil.getNode(nodes, id);
            if (node instanceof DataFrameStepModel) {
                cnt++;
            } else if (node instanceof SubFlowStepModel) {
                hasMixedCommand = true;
            } else if (node instanceof CommandStepModel) {
                hasMixedCommand = true;
            }
        });
        if (hasMixedCommand) return 0;
        return cnt;
    };

    const {mast, selected_step_ids, addStep, addDataSrcStep, addDataDstStep,
           selectSteps, addHistory, baseInspectorDisabled, commandSelectorHidden, nodes} = props;
    const numberOfSelectedDataSources = getNumberOfSelectedDataSources();

    let commandSelector;
    if (numberOfSelectedDataSources) {
        commandSelector = <div>
            <CommandSelector
                nodes={nodes}
                mast={mast}
                numberOfInput={numberOfSelectedDataSources}
                selected_step_ids={selected_step_ids}
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

    return <BaseInspector key={JSON.stringify(selected_step_ids)}
                          header={''}
                          title={selected_step_ids.length + ' files'}
                          disabled={baseInspectorDisabled}>
        <div className='kskp-form'>
            <Button onClick={() => onClickDelete()} danger={true} disabled={baseInspectorDisabled}>
                削除する
            </Button>
        </div>
        {commandSelector}
    </BaseInspector>;
};

export {MultiInspector};

