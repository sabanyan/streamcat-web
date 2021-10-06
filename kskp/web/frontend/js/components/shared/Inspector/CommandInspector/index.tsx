import * as React from "react";
import {useEffect, useState} from "react";
import {SortEndHandler} from "react-sortable-hoc";
import {BaseInspector, InOutConnector, ParamsForm} from "Shared/Inspector";
import style from "../style.scss";
import {Button} from "Shared/Input";
import {CommandStepModel, SubflowCommandModel} from "Model/index";
import Constants from "Constants/index";
import {APIUtil, GraphUtil, ModalUtil, StateUtil} from "Utils/index";
import {CommandParamType, MastType, StepModelType} from "Types/index";
import CommandModel from "Model/Command/CommandModel";
import FlowModel from "Model/Flow/FlowModel";
import {Loader} from "Shared/Base";

type Props = {
    selected_step_ids: string[];
    mast: MastType;
    nodes: [];
    updateStep: Function;
    addHistory: Function;
    selectSteps: Function;
    deleteSteps: Function;
    children?: React.ReactNode;
    sortStepSrcEnd: SortEndHandler;
    baseInspectorDisabled: boolean;
}

const CommandInspector = (props: Props) => {

    const [selectedSubFlow, setSelectedSubFlow] = useState<FlowModel | null>(null);
    const [loaded, setLoaded] = useState<boolean>(false);


    useEffect(() => {
        //データフレームの詳細を取得する
        const selected_step: StepModelType = getSelectedStep();
        setSelectedSubFlow(null);
        if (selected_step instanceof CommandStepModel) {
            const uuid = (selected_step as any).uuid;
            if (selected_step.type === Constants.step.type.subflow && uuid) {
                //サブフローの場合のみ詳細を取得
                APIUtil.get("flows/" + uuid + "?navigation=off").then((response) => {
                    let flowProps = { ...response.data.data.flow, folderPath: response.data.data.folderPath, folderUuid: response.data.data.folderUuid };
                    flowProps.label = response.data.data.label;
                    setSelectedSubFlow(new FlowModel(flowProps));
                    setLoaded(true);
                    // this.forceUpdate();
                });
            } else {
                //サブフロー以外の場合は読み込み完了
                setLoaded(true);
            }
        }

    }, []);

    const getSelectedStep = () => {
        let {selected_step_ids, nodes} = props;
        return GraphUtil.getNode(nodes, (selected_step_ids as any)[0]);
    };

    const onHide = () => {
        //this.props.addHistory()
    };

    const deleteStep = () => {
        const {deleteSteps, selectSteps, addHistory} = props;
        let selected_step = getSelectedStep();
        deleteSteps([selected_step.id]);
        selectSteps();
        addHistory()
    };

    const onClickDelete = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                deleteStep();
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "削除する",
            danger: true,
            content: <div>
                選択されたステップを削除しますか？
            </div>
        });
    };

    const onClickOpenSubFlow = (e, flowUUID: any) => {
        window.location.href = '/flows/' + flowUUID;
    }

    const onChangeInEdge = (e, data) => {
        console.log(e);
        console.log(data);
    };

    const onChangeOutEdge = (e, data) => {
        console.log(e);
        console.log(data);
    };


    const onArgChange = (e, param, value) => {
        update((step) => {
            if (step.args) {
                step.args[param.name] = value;
                if (!value) delete step.args[param.name];
            }
            return step;
        });
    };

    const update = (getNewStep: Function) => {
        const {updateStep} = props;
        let selectedStep = getSelectedStep();
        const newStep = getNewStep(selectedStep);
        updateStep(newStep);
    };

    const onBlurTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {updateStep} = props;
        const selectedStep = getSelectedStep();
        let newSelectedStep = StateUtil.deepCopy(selectedStep);
        newSelectedStep.label = e.target.value;
        updateStep(newSelectedStep);
    };


    const {updateStep, sortStepSrcEnd, baseInspectorDisabled, nodes} = props;
    let selected_step: StepModelType = getSelectedStep();
    let inputForm: React.ReactNode = [];
    let subFlowLink, content, label, subLabel, groups, detail;
    if (selected_step.type === Constants.step.type.command) {
        //指定されたステップの元コマンドを取得
        const command: CommandModel = selected_step.getCommand();
        //選択されたステップのラベルを取得
        label = selected_step.getLabel();
        //コマンドのラベルを取得
        subLabel = command.label;
        groups = (command.groups) ? command.groups : null;
        const params: [CommandParamType] = command.params;
        const args: {} = selected_step.args;
        const invalids: {} = selected_step.invalid;

        inputForm = <ParamsForm disabled={baseInspectorDisabled} params={params} args={args} invalids={invalids} command={command}
                                onChange={(e, param, value) => onArgChange(e, param, value)} groups={groups} />;

    } else if (selected_step.type === Constants.step.type.subflow) {
        const subflowCommand: SubflowCommandModel = selected_step.getCommand();
        label = selected_step.getLabel();
        if (subflowCommand) {
            subLabel = subflowCommand.label;
            const params: [CommandParamType] = subflowCommand.params;
            const args: {} = selected_step.args;
            const invalids: {} = selected_step.invalid;

            inputForm = <ParamsForm disabled={baseInspectorDisabled} params={params} args={args} invalids={invalids}
                                    onChange={(e, param, value) => onArgChange(e, param, value)}/>;
            subFlowLink = <Button onClick={(e) => onClickOpenSubFlow(e, selected_step.uuid)}>フローを開く</Button>;
            if (selectedSubFlow && selectedSubFlow.folderPath) {
                detail = <div>
                    <a href={'/folders/' + selectedSubFlow.folderUuid} target={'_blank'}>{selectedSubFlow.folderPath}</a>
                </div>
            }
        }
    }

    let form;

    if (inputForm) {
        form = <div>
            <div className={style.full_hr} />
            <div>
                <div className="kskp-form">
                    {inputForm}
                </div>
            </div>
        </div>;
    }

    if (!loaded) {
        content = <Loader center={true} absolute={false} fixed={false} visible={true} />;
    } else {
        content = <div>
            <div className={style.actions}>
                {subFlowLink}
                <Button onClick={() => onClickDelete()} danger={true} icon={'delete'} disabled={baseInspectorDisabled}>削除</Button>
            </div>
            <div className={style.full_hr} />
            <div><label>場所</label></div>
            {detail}
            <InOutConnector
                updateStep={updateStep}
                nodes={nodes}
                sortStepSrcEnd={sortStepSrcEnd}
                onChangeInEdge={(e, data) => onChangeInEdge(e, data)}
                onChangeOutEdge={(e, data) => onChangeOutEdge(e, data)} selectedStep={selected_step}
                disabled={baseInspectorDisabled}
            />
            {form}
        </div>;
    }

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector key={selected_step.id} header={""} label={label} subLabel={subLabel}
                          onHide={() => onHide()}
                          onBlurTitle={(e) => onBlurTitle(e)}
                          disabled={baseInspectorDisabled}>
        {content}
    </BaseInspector>;

};


export {CommandInspector};
