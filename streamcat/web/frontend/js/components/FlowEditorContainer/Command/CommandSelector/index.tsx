import React, { useState } from "react";
import style from "./style.scss";
import { Command } from "FlowEditorContainer/Command";
import Constants from "Constants/index";
import { CommandModelType, RunnablesType } from "Types/index";
import { TextField } from "Shared/Input";

type Props = {
    runnables: RunnablesType;
    nodes:any[];
    numberOfInput: number;
    selected_step_ids: string[];
    addStep: Function;
    selectSteps: Function;
    addHistory: Function;
    disabled?: boolean;
    addDataDstStep: Function
    addDataSrcStep: Function
};

const CommandSelector = (props: Props) => {

    const [keyword, setKeyword] = useState<string>("");

    const onChangeKeyword = (e) => {
        setKeyword(e.target.value);
    };

    const sortArray = (array: any[], key: string): any[] => {
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

    const { numberOfInput, selected_step_ids, addStep, addDataDstStep, addDataSrcStep,
        selectSteps, addHistory, runnables, nodes } = props;
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
    operators = operators.filter((command: any): boolean => {
        if (isMultiInPorts(command)) {
            return true;
        } else if (command.ports[0].length === numberOfInput) {
            return true;
        }
        //}
        return false;
    }).filter((command: any) => {
        noOperators = false;
        if (isNoKeyword) {
            return true;
        }
        const foundLabelWithKeyword = (command.label && command.label.indexOf(keyword) != -1);
        const foundDescriptionWithKeyword = (command.description && command.description.indexOf(keyword) != -1);
        const foundCommandIdWithKeyword = (command.id && command.id.indexOf(keyword) != -1);

        return (foundLabelWithKeyword || foundDescriptionWithKeyword || foundCommandIdWithKeyword);
    });
    let operatorsContainer: React.ReactNode[] = [];
    let beforeCommand: CommandModelType = null;
    operators.map((command: CommandModelType, index) => {
        if (!beforeCommand || beforeCommand.classification != command.classification) {
            //区切りを表示
            let label = Constants.lang.classification[command.classification];
            if (!label) label = command.classification;
            operatorsContainer.push(<div key={command.classification + index} className={style.command_separator}>{label}</div>);
        }
        operatorsContainer.push(<Command
            nodes={nodes}
            key={index}
            command={command}
            selected_step_ids={selected_step_ids}
            addStep={addStep}
            addDataDstStep={addDataDstStep}
            addDataSrcStep={addDataSrcStep}
            selectSteps={selectSteps}
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
