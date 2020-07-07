import React, {useState} from "react";
import style from "./style.scss";
import {Command} from "FlowEditorContainer/Command";
import Constants from "Constants/index";
import {CommandModelType, MastType} from "Types/index";
import {TextField} from "Shared/Input";

type Props = {
    mast: MastType;
    numberOfInput: number;
    selected_step_ids: [];
    addStep: Function;
    selectSteps: Function;
    addHistory: Function;
    disabled?: boolean;
}

const CommandSelector = (props: Props) => {


    const [keyword, setKeyword] = useState<string>("");

    const onChangeKeyword = (e) => {
        setKeyword(e.target.value);
    };

    const sortArray = (array: [], key: string): [] => {
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
    const isMultiInPorts = (command: CommandModelType) => {
        if (!command.getInPorts()) return false;
        if (!command.getInPorts().length) return false;
        return (command.getInPorts()[0].name === "*");
    };

    const {numberOfInput, selected_step_ids, addStep, selectSteps, addHistory, disabled} = props;
    const isNoKeyword = (keyword.length == 0);
    let noOperators = true;
    let sortedCommands: [];
    let subflowSortedCommands: [];
    sortedCommands = sortArray((window as any).commands, "id");
    sortedCommands = sortArray(sortedCommands, "classification");
    subflowSortedCommands = sortArray((window as any).subflows, "label");

    sortedCommands = [...subflowSortedCommands, ...sortedCommands] as [];

    //コマンドの絞り込み
    let operators = sortedCommands.filter((command: CommandModelType): boolean => {
        //if(numberOfInput && command.ports){
        if (isMultiInPorts(command)) {
            return true;
        } else if (command.getInPorts().length === numberOfInput) {
            return true;
        }
        //}
        return false;
    }).filter((command: CommandModelType) => {
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
            operatorsContainer.push(<div key={command.id} className={style.command_separator}>{label}</div>);
        }
        operatorsContainer.push(<Command
            command={command}
            selected_step_ids={selected_step_ids}
            addStep={addStep}
            selectSteps={selectSteps}
            key={index}
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

export {CommandSelector};
