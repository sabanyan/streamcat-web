import React, {Fragment, useRef} from "react";
import {BaseInspector} from "Shared/Inspector";
import style from "../style.scss";
import {AddButton, Button} from "Shared/Input";
import {ModalUtil, StringUtil} from "Utils/index";
import Constants from "Constants/index";
import {CommandSelector} from "FlowEditorContainer/Command";
import {FlowModelProps} from "Model/Flow/FlowModel";
import {flowEditorReducerInitialState} from "Modules/flowEditor";

type Props = {
    mast: typeof flowEditorReducerInitialState.mast;
    selected_step_ids: string[];
    nodes: any[];
    addStep: Function;
    addDataSrcStep: Function;
    addDataDstStep: Function;
    selectSteps: Function;
    flow: FlowModelProps;
    updateFlow: Function;
    addHistory: Function;
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
        let {flow} = props;
        flow.label = e.currentTarget.value;
        props.updateFlow(flow);
    };

    const onClickAddFlowParam = () => {
        let {flow, updateFlow} = props;
        const name = setNewParamName("new_param", 1);
        flow.params.push({label:name, name:name, type:'string'});
        updateFlow(flow);
    };

    const setNewParamName = (name: string, cnt: number): string => {
        let {flow} = props;

        const findResult = flow.params.find(param => {
            return param.name === (name + cnt);
        });
        if (findResult) {
            return setNewParamName(name, cnt + 1);
        }
        return name + cnt;
    };

    const onDeleteParam = (index) => {
        let {flow, updateFlow} = props;
        const newParams = flow.params.filter((param, paramIndex) => {
            return (paramIndex !== index);
        });

        flow.params = newParams;
        updateFlow(flow);
    };

    const onDescriptionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        let {flow, updateFlow} = props;
        flow.description = e.currentTarget.value;
        updateFlow(flow);
    };

    const onParamChange = (e: React.SyntheticEvent<HTMLInputElement>, index: number) => {
        let {flow, updateFlow} = props;
        flow.params[index].name = e.currentTarget.value;
        flow.params[index].label = e.currentTarget.value;
        updateFlow(flow);
    };

    const onClickDeleteParam = (e: React.SyntheticEvent<HTMLInputElement>, index: number) => {
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

    const { flow, mast, addStep, addDataDstStep, addDataSrcStep,
            selectSteps, selected_step_ids, addHistory, addFlowVariableHidden,
            commandSelectorHidden, baseInspectorDisabled, nodes } = props;

    if (!flow) return null;

    const {params} = flow;

    let inputParams, inputParamsContainer, addFlowParams;

    inputParams = params.map((param: any, index) => {
        return <div className={style.flow_param}>
            <div className={style.left}>
                <input type={'text'} readOnly={baseInspectorDisabled} className={'form-control'} value={param.name}
                       onChange={(e) => {onParamChange(e, index)}} />
            </div>
            <div className={style.right}>
                <Button danger={true} disabled={baseInspectorDisabled} onClick={() => onClickDeleteParam(param, index)}>削除</Button>
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

    return <BaseInspector key={flow.uuid} header={""} label={flow.label}
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
                        nodes={nodes}
                        mast={mast}
                        numberOfInput={0}
                        selected_step_ids={selected_step_ids}
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
