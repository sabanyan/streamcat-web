import React from "react";
import * as style from './style.scss';
import classnames from "classnames";
import { CommandIcon, SubFlowIcon, DataSrcIcon, DataDstIcon } from "Shared/SVG";
import { ModelUtil, WebUtil } from "Utils/index";
import { AllNodeType, Command, FlowCommand, InlineFlowCommand } from "Model/Library";
import { CommandNode, CommandNodeType, FlowNode, FlowNodeType, FrameNode, FrameNodeType, InlineFlowNodeType } from "Model/Node/NodeTypes";

type Props = {
    nodes: AllNodeType[];
    command: Command | FlowCommand | InlineFlowCommand;
    selectedNodes: AllNodeType[];
    zoom: number;
    addNode: (addNode:AllNodeType, srcNodes:AllNodeType[], dstNodes:AllNodeType[], zoom:number) => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    addHistory: () => void;
    addDataSrcNode: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstNode: (command:Command | FlowCommand | InlineFlowCommand, selectedNodeId:string) => void;
};

export const CommandItem = (props: Props) => {
    const {nodes} = props;

    const getNewNodeWithArgs = (command: Command | FlowCommand, args) => {
        let node:CommandNodeType | FlowNodeType ;

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
            node.label = command.label;
        } else {
            throw Error('command or flow node type only!');
        }
        return node;
    };

    const onClickCommand = (e: React.MouseEvent<HTMLDivElement>, command: Command | FlowCommand | InlineFlowCommand) => {
        const { selectedNodes, zoom, addNode, selectNodes, addHistory, addDataDstNode, addDataSrcNode } = props;

        if (command.hasOwnProperty('flow') && command.classification === "data_source") {
            addDataSrcNode(command);
            // Nodeの選択をキャンセル
            // FIXME: 追加したノードを選択状態にしたい
            selectNodes([]);
        } else if (command.hasOwnProperty('flow') && command.classification === "data_dest") {
            addDataDstNode(command, selectedNodes[0].id);
            // Nodeの選択をキャンセル
            // FIXME: 追加したノードを選択状態にしたい
            selectNodes([]);
        } else {
            const args = {};
            const addedCommandNode = getNewNodeWithArgs(command as Command|FlowCommand, args);

            const outputNodes = command.ports[1].map(() => {
                // const output_step = new DataFrameStepModel({
                //     id: '',
                //     label: null,
                //     type: Constants.step.type.frame,
                //     uuid: null,
                //     dataSource: Constants.data.dataSource.csv
                // });
                const newId = ModelUtil.getNewId(nodes, 'frame');
                const outputNode:FrameNodeType = new FrameNode(newId, {x:0, y:0});
                addNode(outputNode, [], [], zoom);
                return outputNode;
            });

            addNode(addedCommandNode, selectedNodes, outputNodes, zoom);

            // 追加したCommandを選択状態にする
            selectNodes([addedCommandNode]);
        }
        // Undoスタックに履歴を追加する
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
        hasPdfLink = (command.description.includes(".pdf"));
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
