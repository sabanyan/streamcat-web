import React, { useState } from "react";
import lodash from 'lodash';
import * as style from './style.scss';
import { CommandItem } from "FlowEditorContainer/Command";
import { Constants } from "Constants/index";
import { RunnablesType } from "Types/index";
import { TextField } from "Shared/Input";
import { AllNodeType, Command, FlowCommand, InlineFlowCommand } from "Model/Library";
import StringUtil from 'Utils/StringUtil';

type Props = {
    runnables: RunnablesType;
    nodes:AllNodeType[];
    numberOfInput: number;
    selectedNodes: AllNodeType[];
    zoom: number;
    addNode: (addNode:AllNodeType, srcNodes:AllNodeType[], dstNodes:AllNodeType[], zoom:number) => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    addHistory: () => void;
    disabled?: boolean;
    addDataSrcNode: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstNode: (command:Command | FlowCommand | InlineFlowCommand, selectedNodeId:string) => void;
};

export const CommandSelector = (props: Props) => {

    const [keyword, setKeyword] = useState<string>("");

    const onChangeKeyword = (e) => {
        setKeyword(e.target.value);
    };

    // key1とkey2でソートする
    const sortCommands = <T,>(commands:T[], key1:string, key2:string=''): T[] => {
        return lodash.orderBy(commands, item => [item[key1],item[key2]]);
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

    const { numberOfInput, selectedNodes, zoom, addNode, addDataDstNode, addDataSrcNode,
        selectNodes, addHistory, runnables, nodes } = props;
    const { commands, subflows, datasrcs, datadsts } = runnables;

    const isNoKeyword = (keyword.length == 0);
    let noOperators = true;
    const sortedCommands = {
        datasrcs: sortCommands(datasrcs, 'label'),
        datadsts: sortCommands(datadsts, 'label'),
        subflows: sortCommands(subflows, 'classification', 'label'),
        commands: sortCommands(commands, 'classification', 'id'),
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
        const foundLabelWithKeyword = StringUtil.includesNoCase(command.label, keyword);
        const foundDescriptionWithKeyword = StringUtil.includesNoCase(command.description, keyword);
        const foundCommandIdWithKeyword = StringUtil.includesNoCase((command as Command).id, keyword);

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
            selectedNodes={selectedNodes}
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
            {/* Note: ConsoleのIssueを抑制するためname属性を設定する */}
            <TextField  name='cmdKeyword'
                        className={"mb-8px"} 
                        placeholder={"キーワード"}
                        onChange={(e) => onChangeKeyword(e)} />
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
