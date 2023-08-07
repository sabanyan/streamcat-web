import React, {Fragment, useRef} from "react";
import {BaseInspector} from "Shared/Inspector";
import style from "../style.scss";
import {AddButton, Button} from "Shared/Input";
import {ModalUtil} from "Utils/index";
import Constants from "Constants/index";
import {CommandSelector} from "FlowEditorContainer/Command";
import { AllNodeType, Command, Flow, FlowCommand, FlowType, InlineFlowCommand } from "Model/Library";
import { RunnablesType } from 'Types/index';

type Props = {
    runnables: RunnablesType;
    selectedStepIds: string[];
    // nodes: any[];
    zoom: number;
    addStep: (add_step:AllNodeType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => void;
    addDataSrcStep: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstStep: (command:Command | FlowCommand | InlineFlowCommand, selectedStepId:string) => void;
    selectSteps: (selected_steps: any[]) => void;
    flow: Flow;
    flowUuid: string;
    updateFlow: (flow:Flow, zoom:number) => void;
    addHistory: () => void;
    addFlowVariableHidden: boolean;
    commandSelectorHidden: boolean;
    baseInspectorDisabled: boolean;
}

/*
  フローエディタで表示中のフローのInspector
*/
const FlowSettingsInspector = (props: Props) => {

    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    const onBlurTitle = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const {flow} = props;
        flow.label = e.currentTarget.value;
        props.updateFlow(flow, zoom);
    };

    const onClickAddFlowParam = () => {
        const {flow, updateFlow} = props;
        const name = setNewParamName("new_param", 1);
        flow.params.push({label:name, name:name, type:'string'});
        updateFlow(flow, zoom);
    };

    const setNewParamName = (name: string, cnt: number): string => {
        const flow = props.flow;

        const findResult = flow.params.find(param => {
            return param.name === (name + cnt);
        });
        if (findResult) {
            return setNewParamName(name, cnt + 1);
        }
        return name + cnt;
    };

    const onDeleteParam = (index) => {
        const {flow, updateFlow} = props;
        flow.params = flow.params.filter((param, paramIndex) => {
            return paramIndex !== index;
        });
        updateFlow(flow, zoom);
    };

    const onDescriptionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const {flow, updateFlow} = props;
        flow.description = e.currentTarget.value;
        updateFlow(flow, zoom);
    };

    const onParamChange = (e: React.SyntheticEvent<HTMLInputElement>, index: number) => {
        const {flow, updateFlow} = props;
        flow.params[index].name = e.currentTarget.value;
        flow.params[index].label = e.currentTarget.value;
        updateFlow(flow, zoom);
    };

    const onClickDeleteParam = (e: React.MouseEvent, index: number) => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                onDeleteParam(index);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "削除する",
            danger: true,
            content: <div>
                選択されたフロー変数を削除しますか？
            </div>
        });
    };

    const { flow, flowUuid, runnables, zoom, addStep, addDataDstStep, addDataSrcStep,
            selectSteps, selectedStepIds, addHistory, addFlowVariableHidden,
            commandSelectorHidden, baseInspectorDisabled } = props;

    if (!flow) return null;

    let inputParamsContainer, addFlowParams;

    const inputParams = flow.params.map((param, index) => {
        return <div className={style.flow_param}>
            <div className={style.left}>
                <input type={'text'} readOnly={baseInspectorDisabled} className={'form-control'} value={param.name}
                       onChange={(e) => {onParamChange(e, index)}} />
            </div>
            <div className={style.right}>
                <Button danger={true} disabled={baseInspectorDisabled} onClick={e => onClickDeleteParam(e, index)}>削除</Button>
            </div>
        </div>;
    });

    if (inputParams && inputParams.length) {
        inputParamsContainer = <div className={"mt-8px"}>
            <label>フロー変数</label>
            {inputParams}
        </div>;
    } else if (baseInspectorDisabled) {
        inputParamsContainer = <div className={"mt-8px"}>
            <label>フロー変数</label>
            <div className={"text-center"}>
                <div className={style.label}>
                フロー変数が設定されていません
                </div>
            </div>
        </div>;
    } else {
        inputParamsContainer = <div className={"mt-8px"}>
            <label>フロー変数</label>
        </div>;
    }

    if (!addFlowVariableHidden) {
        addFlowParams = <AddButton onClick={() => onClickAddFlowParam()}>フロー変数を追加する</AddButton>;
    }

    return <BaseInspector key={flowUuid} header={""} label={flow.label}
                          onBlurTitle={(e) => onBlurTitle(e)}
                          disabled={baseInspectorDisabled}>
        <textarea className={'form-control mb-8px'} placeholder={"フローの説明"} ref={descriptionRef}
                  defaultValue={flow.description} rows={8}
                  onChange={(e) => onDescriptionChange(e)} disabled={(baseInspectorDisabled)} />
        {inputParamsContainer}
        {addFlowParams}
        {
            (!commandSelectorHidden) ?
                <Fragment>
                    <div className={style.full_hr} />
                    <CommandSelector
                        // nodes={nodes}
                        runnables={runnables}
                        numberOfInput={0}
                        selectedStepIds={selectedStepIds}
                        zoom={zoom}
                        addStep={addStep}
                        addDataSrcStep={addDataSrcStep}
                        addDataDstStep={addDataDstStep}
                        selectSteps={selectSteps}
                        addHistory={addHistory}
                    />
                </Fragment>
            : null
        }
    </BaseInspector>;
};


export {FlowSettingsInspector};
