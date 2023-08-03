import React from 'react';
import {useAsyncResource} from 'use-async-resource';
import {BaseInspector, InOutConnector, ParamsForm} from "Shared/Inspector";
import style from "../style.scss";
import {Button} from "Shared/Input";
import Constants from "Constants/index";
import {GraphUtil, ModalUtil, StateUtil} from "Utils/index";
import { Api } from 'Api';
import {CommandParamType, RunnablesType, StepModelType} from "Types/index";
import CommandModel from "Model/Command/CommandModel";
import { Command, FlowCommand } from 'Model/Library';

type Props = {
    selectedStepIds: string[];
    // runnables: RunnablesType;
    nodes: any[];
    updateStep: Function;
    addHistory: Function;
    selectSteps: (selected_steps: any[]) => void;
    deleteSteps: (step_ids: string[]) => void;
    // children?: React.ReactNode;
    baseInspectorDisabled: boolean;
}

const getFlow = (uuid: string) => {
    if(uuid){
        return Api.findFlow(uuid);
    }else{
        // uuidが指定されない場合はAPIを発行しない
        return Api.findNull();
    }
}

const CommandInspector = (props: Props) => {

    const getSelectedStep = () => {
        let {selectedStepIds, nodes} = props;
        return GraphUtil.getNode(nodes, selectedStepIds[0]);
    };

    // 選択中のステップを取得する
    const selected_step: StepModelType = getSelectedStep();

    // ここでFlowの取得を開始する
    const [flowReader] = useAsyncResource(getFlow, (selected_step as any).uuid);

    const onHide = () => {
        //this.props.addHistory()
    };

    const deleteStep = () => {
        const {deleteSteps, selectSteps, addHistory} = props;
        let selected_step = getSelectedStep();
        deleteSteps([selected_step.id]);
        selectSteps([]);
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


    const {updateStep, baseInspectorDisabled, nodes} = props;
    let inputForm: React.ReactNode = [];
    let subFlowLink, label, subLabel, detail;
    if (selected_step.type === Constants.step.type.command) {
        //指定されたステップの元コマンドを取得
        const command: Command = selected_step.getCommand();
        //選択されたステップのラベルを取得
        label = selected_step.label;
        //コマンドのラベルを取得
        subLabel = command.label;
        const params: CommandParamType[] = command.params;
        const args: {} = selected_step.args;
        const invalids: {} = selected_step.invalid;

        inputForm = <ParamsForm disabled={baseInspectorDisabled} params={params} args={args} invalids={invalids} command={command}
                                onChange={(e, param, value) => onArgChange(e, param, value)} groups={command.groups} />;

    } else if (selected_step.type === Constants.step.type.subflow) {
        const subflowCommand: FlowCommand = selected_step.getCommand();
        label = selected_step.label;
        if (subflowCommand) {
            subLabel = subflowCommand.label;
            const params: CommandParamType[] = subflowCommand.params;
            const args: {} = selected_step.args;
            const invalids: {} = selected_step.invalid;

            inputForm = <ParamsForm disabled={baseInspectorDisabled} params={params} args={args} invalids={invalids}
                                    onChange={(e, param, value) => onArgChange(e, param, value)}/>;
            subFlowLink = <Button onClick={(e) => onClickOpenSubFlow(e, selected_step.uuid)}>フローを開く</Button>;

            // サブフローがライブラリに存在する場合(リテラルでない場合)はそのサブフローの格納フォルダへのリンクを表示する
            const flow = flowReader();
            if(flow){
                detail = <div>
                    <a href={'/folders/' + flow.folderUuid} target={'_blank'}>{flow.folderPath}</a>
                </div>
            }
        }
    }

    let form;

    if (inputForm) {
        form = <div>
            <div className={style.full_hr} />
            <div>
                <div className="streamcat-form">
                    {inputForm}
                </div>
            </div>
        </div>;
    }

    const content = <div>
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
            selectedStep={selected_step}
            disabled={baseInspectorDisabled}
        />
        {form}
    </div>;

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector key={selected_step.id} header={""} label={label} subLabel={subLabel}
                          onHide={() => onHide()}
                          onBlurTitle={(e) => onBlurTitle(e)}
                          disabled={baseInspectorDisabled}>
        {content}
    </BaseInspector>;

};


export {CommandInspector};
