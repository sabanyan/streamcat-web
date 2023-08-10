import React, { useState } from "react";
import Constants from "Constants/index";
import style from "./style.scss";
import classnames from "classnames";
import { CommandIcon, SubFlowIcon, DataSrcIcon, DataDstIcon } from "Shared/SVG";
import { ModelUtil, WebUtil } from "Utils/index";
import { AllNodeType, Command, FlowCommand, InlineFlowCommand } from "Model/Library";
import { CommandNode, CommandNodeType, FlowNode, FlowNodeType, FrameNode, FrameNodeType, InlineFlowNodeType } from "Model/Step/NodeTypes";

type Props = {
    nodes: AllNodeType[];
    command: Command | FlowCommand | InlineFlowCommand;
    selectedStepIds: string[];
    zoom: number;
    addStep: (add_step:AllNodeType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => void;
    selectSteps: (selected_steps: any[]) => void;
    addHistory: () => void;
    addDataSrcStep: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstStep: (command:Command | FlowCommand | InlineFlowCommand, selectedStepId:string) => void;
};

export const CommandItem = (props: Props) => {

    const [inputRefs, setInputRefs] = useState<any[]>([]);

    const {nodes} = props;

    const onBuild = (param, element) => {
        if (element) setInputRefs([...inputRefs, { param: param, element: element }]);
    };

    const onSubmitModal = (e: React.FormEvent) => {
        e.preventDefault();
        //クリックされたときのEventEmitterを実行
        const id = Constants.modal.ADD_COMMAND;
        window.emitter.emit(Constants.event.MODAL_ON_CLICK_DONE + id, { id: id });
    };

    const getNewStepWithArgs = (command: Command | FlowCommand, args) => {
        let node:CommandNodeType | FlowNodeType ;
        let model: any = {
            id: null,
            name: command.label,
            label: null,
            args: args
        };

        // if (command instanceof CommandModel) {
        if (command.hasOwnProperty('id')) {
            // (model as any).type = Constants.step.type.command;
            // (model as any).commandId = command.id;
            // node = new CommandStepModel((model as any));
            // node.initArgs();
            const newId = ModelUtil.getNewId(nodes, 'command');
            node = new CommandNode(newId, (command as Command).id || '', {x:0, y:0});
            node.label = command.label;
            node.args = args;

        // } else if (command instanceof FlowCommand) {
        } else if (command.hasOwnProperty('uuid')) {
            // (model as any).type = Constants.step.type.subflow;
            // (model as any).uuid = command.uuid;
            // node = new SubFlowStepModel((model as any));
            const newId = ModelUtil.getNewId(nodes, 'flow');
            node = new FlowNode(newId, (command as FlowCommand).uuid, {x:0, y:0})
            node.label == command.label
        } else {
            throw Error('command or flow node type only!');
        }
        return node;
    };

    const onClickCommand = (e: React.MouseEvent<HTMLDivElement>, command: Command | FlowCommand | InlineFlowCommand) => {
        const { selectedStepIds, zoom, addStep, selectSteps, addHistory, addDataDstStep, addDataSrcStep } = props;

        if (command.hasOwnProperty('flow') && command.classification === "data_source") {
            addDataSrcStep(command);
        } else if (command.hasOwnProperty('flow') && command.classification === "data_dest") {
            addDataDstStep(command, selectedStepIds[0]);
        } else {
            const args = {};
            const added_command_step = getNewStepWithArgs(command as Command|FlowCommand, args);

            const output_steps = command.ports[1].map(() => {
                // const output_step = new DataFrameStepModel({
                //     id: '',
                //     label: null,
                //     type: Constants.step.type.frame,
                //     uuid: null,
                //     dataSource: Constants.data.dataSource.csv
                // });
                const newId = ModelUtil.getNewId(nodes, 'frame');
                const output_step:FrameNodeType = new FrameNode(newId, {x:0, y:0});
                addStep(output_step, [], [], zoom);
                return output_step;
            });

            const output_step_ids = output_steps.map(step => step.id);

            addStep(added_command_step, selectedStepIds, output_step_ids, zoom);
        }
        //ステップの選択をキャンセル
        selectSteps([]);
        addHistory();
    };

    const onClickPdf = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        window.open(url);
        e.preventDefault();
        e.stopPropagation();
    };

    const { command } = props;
    const iconClass = classnames(style.command_icon);

    let hasPdfLink = false;

    if (command.description) {
        hasPdfLink = (command.description.indexOf(".pdf") !== -1);
    }

    let description;
    if (hasPdfLink) {
        const url = WebUtil.webURL(command.description || '');
        description =
            <a className={style.show_detail} href="#" onClick={(e) => onClickPdf(e, url)}
                onMouseDown={e => e.stopPropagation()}>詳細を見る</a>;
    } else {
        description = command.description;
    }

    let icon: React.ReactNode;
    if(command.hasOwnProperty('id')){
        icon = <CommandIcon command={command as Command} />;
    } else if(command.classification === "data_source") {
        icon = <DataSrcIcon />;
    } else if (command.classification === "data_dest") {
        icon = <DataDstIcon />;
    } else {
        icon = <SubFlowIcon />;
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
