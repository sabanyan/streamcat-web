import * as React from "react";
import {useEffect, useState} from "react";
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
    selected_step_ids: [];
    mast: MastType;
    nodes: [];
    updateStep: Function;
    addHistory: Function;
    selectSteps: Function;
    deleteSteps: Function;
    children?: React.ReactNode;
    sortStepSrcEnd: Function;
    readOnly: boolean;
}

const CommandInspector = (props: Props) => {

    const [selectedSubFlow, setSelectedSubFlow] = useState<FlowModel | null>(null);
    const [loaded, setLoaded] = useState<boolean>(false);


    useEffect(() => {
        //データフレームの詳細を取得する
        const selected_step: StepModelType = getSelectedStep();
        setSelectedSubFlow(null);
        if (selected_step instanceof CommandStepModel) {
            if (selected_step.type === Constants.step.type.subflow) {
                //サブフローの場合のみ詳細を取得
                const uuid = (selected_step as any).uuid;
                APIUtil.get("flows/" + uuid + "?navigation=off").then((response) => {
                    setSelectedSubFlow(new FlowModel(response.data.data));
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
        const {deleteSteps, selectSteps} = props;
        let selected_step = getSelectedStep();
        deleteSteps([selected_step.id]);
        selectSteps();
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


    const {updateStep, sortStepSrcEnd, readOnly, nodes} = props;
    let selected_step: StepModelType = getSelectedStep();
    let inputForm: React.ReactNode = [];
    let subFlowLink, content, label, subLabel, groups;
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

        inputForm = <ParamsForm disabled={readOnly} params={params} args={args} invalids={invalids} command={command}
                                onChange={(e, param, value) => onArgChange(e, param, value)} groups={groups} />;

    } else if (selected_step.type === Constants.step.type.subflow) {
        const subflowCommand: SubflowCommandModel = selected_step.getCommand();
        label = selected_step.getLabel();
        subLabel = subflowCommand.label;
        const params: [CommandParamType] = subflowCommand.params;
        const args: {} = selected_step.args;
        const invalids: {} = selected_step.invalid;

        inputForm = <ParamsForm disabled={readOnly} params={params} args={args} invalids={invalids} command={null}
                                onChange={(e, param, value) => onArgChange(e, param, value)}/>;

        subFlowLink = <a href={"/flows/" + selected_step.uuid} target={"_blank"}>フローを開く</a>;
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
            {subFlowLink}
            <div className={style.full_hr} />
            <InOutConnector
                updateStep={updateStep}
                nodes={nodes}
                sortStepSrcEnd={sortStepSrcEnd}
                onChangeInEdge={(e, data) => onChangeInEdge(e, data)}
                onChangeOutEdge={(e, data) => onChangeOutEdge(e, data)} selectedStep={selected_step}
                selectedSubFlow={selectedSubFlow}
                disabled={readOnly}
            />
            {form}
            <div className={style.full_hr} />
            <Button onClick={() => onClickDelete()} danger={true} disabled={readOnly}>削除</Button>
        </div>;
    }

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector key={selected_step.id} header={""} label={label} subLabel={subLabel}
                          name={selected_step.id} onHide={() => onHide()}
                          onBlurTitle={(e) => onBlurTitle(e)}
                          disabled={readOnly}>
        {content}
    </BaseInspector>;

};


export {CommandInspector};
