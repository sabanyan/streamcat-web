import * as React from "react";
import {useAsyncResource} from 'use-async-resource';
import {SortEndHandler} from "react-sortable-hoc";
import {BaseInspector, InOutConnector, ParamsForm} from "Shared/Inspector";
import style from "../style.scss";
import {Button} from "Shared/Input";
import {DatumType, SubflowCommandModel} from "Model/index";
import Constants from "Constants/index";
import {GraphUtil, ModalUtil, StateUtil} from "Utils/index";
import {CommonResponse} from 'Modules/api/core/index';
import {CommandParamType, MastType, StepModelType} from "Types/index";
import CommandModel from "Model/Command/CommandModel";

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

// GET /flowsを発行する関数を定義する
type LibraryResponse = CommonResponse<DatumType>;
const fetchFlow = (uuid: number): Promise<LibraryResponse> => {
    if(uuid){
        return fetch('/api/v0/flows/' + uuid).then<LibraryResponse>(res => res.json());
    }else{
        // uuidがない場合はAPIを発行しない
        return new Promise<LibraryResponse>(() => {});
    }
}

const CommandInspector = (props: Props) => {

    const getSelectedStep = () => {
        let {selected_step_ids, nodes} = props;
        return GraphUtil.getNode(nodes, (selected_step_ids as any)[0]);
    };

    // 選択中のステップを取得する
    const selected_step: StepModelType = getSelectedStep();

    // ここでFlowの取得を開始する
    const [flowReader] = useAsyncResource(fetchFlow, (selected_step as any).uuid);

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
    let inputForm: React.ReactNode = [];
    let subFlowLink, label, subLabel, detail;
    if (selected_step.type === Constants.step.type.command) {
        //指定されたステップの元コマンドを取得
        const command: CommandModel = selected_step.getCommand();
        //選択されたステップのラベルを取得
        label = selected_step.getLabel();
        //コマンドのラベルを取得
        subLabel = command.label;
        const params: [CommandParamType] = command.params;
        const args: {} = selected_step.args;
        const invalids: {} = selected_step.invalid;

        inputForm = <ParamsForm disabled={baseInspectorDisabled} params={params} args={args} invalids={invalids} command={command}
                                onChange={(e, param, value) => onArgChange(e, param, value)} groups={command.groups} />;

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

            // サブフローがライブラリに存在する場合(リテラルでない場合)はそのサブフローの格納フォルダへのリンクを表示する
            if(subflowCommand.uuid){
                const response = flowReader();
                const datum = response.data;
                detail = <div>
                    <a href={'/folders/' + datum.folderUuid} target={'_blank'}>{datum.folderPath}</a>
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
            sortStepSrcEnd={sortStepSrcEnd}
            onChangeInEdge={(e, data) => onChangeInEdge(e, data)}
            onChangeOutEdge={(e, data) => onChangeOutEdge(e, data)} selectedStep={selected_step}
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
