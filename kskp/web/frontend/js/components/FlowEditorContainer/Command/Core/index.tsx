import React, {useState} from "react";
import Constants from "Constants/index";
import {CommandStepModel, DataFrameStepModel, SubflowCommandModel, SubFlowStepModel} from "Model/index";
import style from "./style.scss";
import classnames from "classnames";
import {CommandStepModelProps} from "Model/Step/CommandStepModel";
import CommandModel from "Model/Command/CommandModel";
import {CommandIcon, SubFlowIcon} from "Shared/SVG";
import {CommandModelType, CommandParamType, CommandPortType} from "Types/index";
import {ParamUtil, WebUtil} from "Utils/index";

type Props = {
    command: CommandModelType;
    selected_step_ids: string[];
    addStep: Function;
    selectSteps: Function;
    addHistory: Function;
}
const Command = (props: Props) => {

    const [inputRefs, setInputRefs] = useState<any[]>([]);

    const onBuild = (param, element) => {
        if (element) setInputRefs([...inputRefs, {param: param, element: element}]);
    };

    const buildParamsContent = () => {
        const {command} = props;
        setInputRefs([]); //クリア
        let paramsInputs = command.params.map((param: CommandParamType) => {
            const _onBuild = (param, element) => onBuild(param, element);
            let paramElement = ParamUtil.getParamElement(param, _onBuild);
            return <div key={command.id + "_" + param.name} className="mb-8px">
                {paramElement}
            </div>;
        });

        if (!paramsInputs.length) paramsInputs = <div>このフローには設定可能な変数がありません。</div>;

        const content = <form onSubmit={onSubmitModal}>
            {paramsInputs}
        </form>;

        return content;
    };

    const onSubmitModal = (e: React.FormEvent) => {
        e.preventDefault();
        //クリックされたときのEventEmitterを実行
        const id = Constants.modal.ADD_COMMAND;
        window.emitter.emit(Constants.event.MODAL_ON_CLICK_DONE + id, {id: id});
    };

    const getNewStepWithArgs = (command: CommandModelType, args): CommandStepModelProps => {
        let node;
        let model: any = {
            id: null,
            name: command.label,
            label: null,
            args: args
        };

        if (command instanceof CommandModel) {
            (model as any).type = Constants.step.type.command;
            (model as any).commandId = command.id;
            node = new CommandStepModel((model as any));
            node.initArgs();
        } else if (command instanceof SubflowCommandModel) {
            (model as any).type = Constants.step.type.subflow;
            (model as any).uuid = command.uuid;
            node = new SubFlowStepModel((model as any));
        }
        return node;

    };

    const onClickCommand = (e: React.MouseEvent<HTMLDivElement>, command: CommandModel) => {
        const args = {};
        const added_command_step: CommandStepModelProps = getNewStepWithArgs(command, args);

        const {selected_step_ids, addStep, selectSteps, addHistory} = props;
        const output_steps = command.getOutPorts().map((port: CommandPortType) => {
            const output_step = new DataFrameStepModel({
                id: null,
                label: null,
                type: Constants.step.type.frame,
                uuid: null,
                dataSource: Constants.data.dataSource.csv
            });
            addStep(output_step);
            return output_step;
        });

        const output_step_ids = output_steps.map(step => step.id);

        addStep(added_command_step, selected_step_ids, output_step_ids);

        //ステップの選択をキャンセル
        selectSteps();
        addHistory();
    };

    const onClickPdf = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        window.open(url);
        e.preventDefault();
        e.stopPropagation();
    };

    const {command} = props;
    const iconClass = classnames(style.command_icon);

    let hasPdfLink = false;

    if (command.description) {
        hasPdfLink = (command.description.indexOf(".pdf") !== -1);
    }

    let description;
    if (hasPdfLink) {
        const url = WebUtil.webURL(command.description);
        description =
            <a className={style.show_detail} href="javascript:return false;" onClick={(e) => onClickPdf(e, url)}
               onMouseDown={e => e.stopPropagation()}>詳細を見る</a>;
    } else {
        description = command.description;
    }

    let icon: React.ReactNode;
    if (command instanceof SubflowCommandModel) {
        icon = <SubFlowIcon />;
    } else {
        icon = <CommandIcon command={command} />;
    }

    return <div className={style.command} onClick={(e: React.MouseEvent<HTMLDivElement>) => onClickCommand(e, command)}>
        <svg className={iconClass}>
            {icon}
        </svg>
        <div className={style.command_label_container}>
            <div className={style.command_label}>
                {command.label}
            </div>
            <div className={style.command_description}>
                {description}
            </div>
        </div>
    </div>;
};

export {Command}
