import React, {Fragment, useRef} from "react";
import {BaseInspector} from "Shared/Inspector";
import style from "../style.scss";
import {AddButton, Button} from "Shared/Input";
import {ModalUtil} from "Utils/index";
import Constants from "Constants/index";
import {CommandSelector} from "FlowEditorContainer/Command";
import {MastType, SubFlowParamType} from "Types/index";
import {FlowModelProps} from "Model/Flow/FlowModel";

type Props = {
    mast: MastType;
    selected_step_ids: [];
    addStep: Function;
    selectSteps: Function;
    flow: FlowModelProps;
    updateFlow: Function;
    addHistory: Function;
    readOnly: boolean;
}

let paramRefs: any[] = [];
const FlowSettingsInspector = (props: Props) => {

    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    const onHide = () => {
        const {updateFlow} = props;
        const {flow}: { flow: FlowModelProps } = props;
        if (descriptionRef && descriptionRef.current) {
            flow.description = descriptionRef.current.value;
            flow.params = getCurrentParams();
            updateFlow(flow);
        }
    };

    const getCurrentParams = () => {
        //現在入力中のすべてのParamsを取得する
        let params: SubFlowParamType[] = [];
        paramRefs.forEach(elem => {
            let param: SubFlowParamType = {};
            param["label"] = elem.value;
            param["name"] = elem.value;
            param["type"] = "string";
            params.push(param);
        });
        return params;
    };

    const onBlurTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        let {flow, updateFlow} = props;
        flow.label = e.target.value;
        updateFlow(flow);
    };

    const onClickAddFlowParam = () => {
        let {flow, updateFlow} = props;
        const name = setNewParamName("new_param", 1);
        flow.params.push({label: name, name: name, type: "string"});
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

    const onDeleteParam = (param) => {
        let {flow, updateFlow} = props;
        const newParams = flow.params.filter(p => {
            return (p.name !== param.name);
        });

        flow.params = newParams;
        updateFlow(flow);
    };

    const onClickDeleteParam = (param) => {

        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                onDeleteParam(param);
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

    const onDescriptionChange = (e) => {
        let {flow, updateFlow} = props;
        flow.description = e.currentTarget.value;
        updateFlow(flow);
    };

    const onParamChange = () => {
        let {flow, updateFlow} = props;
        let params = getCurrentParams();
        flow.params = params;
        updateFlow(flow);
    };

    const {flow, mast, addStep, selectSteps, selected_step_ids, addHistory, readOnly} = props;
    if (!flow) return null;
    const {params} = flow;

    let inputParams, inputParamsContainer, addFlowParams;
    paramRefs = [];
    inputParams = params.map((param: any, index) => {
        return <div key={index} className={style.flow_param}>
            <div className={style.left}>
                <input ref={(ref) => {
                    //render時にrefがnullのケースでcallされる場合があるので、
                    //refがあることを確認してから入れる
                    if (ref) {
                        paramRefs.push(ref);
                    }
                }} type={"text"} className={"form-control"} defaultValue={param.name}
                       onChange={() => {
                           onParamChange();
                       }} />
            </div>
            <div className={style.right}>
                <Button danger={true} onClick={() => onClickDeleteParam(param)}>削除</Button>
            </div>
        </div>;
    });

    if (inputParams) {
        inputParamsContainer = <div>
            <label>フロー変数</label>
            {inputParams}
        </div>;
    } else {
        inputParamsContainer = <div>
            フロー変数の設定がありません
        </div>;
    }
    addFlowParams = <AddButton onClick={() => onClickAddFlowParam()} disabled={(readOnly)}>フロー変数を追加する</AddButton>;

    return <BaseInspector header={""} label={flow.label}
                          onBlurTitle={(e) => onBlurTitle(e)} onHide={() => onHide()}
                          disabled={readOnly}>
      <textarea className={"mb-8px form-control"} placeholder={"フローの説明"} ref={descriptionRef}
                defaultValue={flow.description} rows={8}
                onChange={(e) => onDescriptionChange(e)} disabled={(readOnly)} />
        {inputParamsContainer}
        {addFlowParams}
        {
            (!readOnly) ?
                <Fragment>
                    <div className={style.full_hr} />
                    <CommandSelector
                        mast={mast}
                        numberOfInput={0}
                        selected_step_ids={selected_step_ids}
                        addStep={addStep}
                        selectSteps={selectSteps}
                        addHistory={addHistory}
                    />
                </Fragment>
                : null
        }
    </BaseInspector>;
};


export {FlowSettingsInspector};
