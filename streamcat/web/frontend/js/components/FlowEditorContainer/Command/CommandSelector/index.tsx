import React, { useState } from "react";
import style from "./style.scss";
import { CommandItem } from "FlowEditorContainer/Command";
import Constants from "Constants/index";
import { RunnablesType } from "Types/index";
import { TextField } from "Shared/Input";
import { AllNodeType, Command, FlowCommand, InlineFlowCommand } from "Model/Library";

type Props = {
    runnables: RunnablesType;
    nodes:AllNodeType[];
    numberOfInput: number;
    selectedNodeIds: string[];
    zoom: number;
    addNode: (addNode:AllNodeType, srcNodeIds:string[], dstNodeIds:string[], zoom:number) => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    addHistory: () => void;
    disabled?: boolean;
    addDataSrcNode: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstNode: (command:Command | FlowCommand | InlineFlowCommand, selectedNodeId:string) => void;
};

const CommandSelector = (props: Props) => {

    const [keyword, setKeyword] = useState<string>("");

    const onChangeKeyword = (e) => {
        setKeyword(e.target.value);
    };

    const sortArray = <T,>(array: T[], key: string): T[] => {
        return array.sort((objectA, objectB) => {
            const a = objectA[key];
            const b = objectB[key];
            let comparison = 0;
            if (a > b) {
                comparison = 1;
            } else if (a < b) {
                comparison = -1;
            }
            return comparison;
        });
    };

    /**
     * 複数個の入力ができるコマンド（入力ポートのtype が *）かどうか判定する
     * @param command
     * @returns {boolean}
     */
    const isMultiInPorts = (command: any) => {
        if (!command.ports[0]) return false;
        if (!command.ports[0].length) return false;
        return (command.ports[0][0].label === "*");
    };

    const { numberOfInput, selectedNodeIds, zoom, addNode, addDataDstNode, addDataSrcNode,
        selectNodes, addHistory, runnables, nodes } = props;
    const { commands, subflows, datasrcs, datadsts } = runnables;

    const isNoKeyword = (keyword.length == 0);
    let noOperators = true;
    const sortedCommands = {
        datasrcs: sortArray(datasrcs, "label"),
        datadsts: sortArray(datadsts, "label"),
        subflows: sortArray(sortArray(subflows, "label"), "classification"),
        commands: sortArray(sortArray(commands, "id"), "classification"),
    }


    let operators = [...sortedCommands.datasrcs, ...sortedCommands.datadsts,
    ...sortedCommands.subflows, ...sortedCommands.commands];

    //コマンドの絞り込み
    operators = operators.filter((command): boolean => {
        if (isMultiInPorts(command)) {
            return true;
        } else if (command.ports[0].length === numberOfInput) {
            return true;
        }
        //}
        return false;
    }).filter((command) => {
        noOperators = false;
        if (isNoKeyword) {
            return true;
        }
        const foundLabelWithKeyword = (command.label && command.label.indexOf(keyword) != -1);
        const foundDescriptionWithKeyword = (command.description && command.description.indexOf(keyword) != -1);
        const foundCommandIdWithKeyword = ((command as Command).id && (command as Command).id.indexOf(keyword) != -1);

        return (foundLabelWithKeyword || foundDescriptionWithKeyword || foundCommandIdWithKeyword);
    });
    let operatorsContainer: React.ReactNode[] = [];
    let beforeCommand: Command | FlowCommand | InlineFlowCommand;
    operators.forEach((command, index) => {
        if (!beforeCommand || beforeCommand.classification != command.classification) {
            // 区切りを表示
            // classificationがない場合はSubFlowのはず
            const label = Constants.lang.classification[command.classification || 'subflow'] || command.classification;
            operatorsContainer.push(
                <div key={`separator-${index}`} className={style.command_separator}>{label}</div>
            );
        }
        operatorsContainer.push(<CommandItem
            nodes={nodes}
            key={index}
            command={command}
            selectedNodeIds={selectedNodeIds}
            zoom={zoom}
            addNode={addNode}
            addDataDstNode={addDataDstNode}
            addDataSrcNode={addDataSrcNode}
            selectNodes={selectNodes}
            addHistory={addHistory}
        />);
        beforeCommand = command;
    });

    let commandSelector;

    if (!noOperators) {

        commandSelector = <div>
            <TextField className={"mb-8px"} onChange={(e) => onChangeKeyword(e)}
                placeholder={"キーワード"} />
            <div className={style.command_selector_container}>
                {(operatorsContainer.length) ? operatorsContainer : <div
                    className={style.command_not_found}>コマンドが見つかりませんでした</div>}
            </div>
        </div>;
    }

    return <div>
        {commandSelector}
    </div>;
};

export { CommandSelector };
