import React from 'react';
import {AddButton} from 'Shared/Input';
import {HttpUtil} from 'Utils/index';
import style from './style.scss';
import { FlowType } from 'Model/Library';

type LibraryListDataType = {
    createdAt: string;
    creator: string;
    label: string;
    type: string;
    uuid: string;
    selected: boolean;
};

type Props = {
    runArgs: {
        flowUuid: string;
        flows: any[];
        variables: any[];
    };
    updateRunArgs: Function;
    flow: FlowType;
};

export const InputFlowForm = (props: Props) => {
    const [, updateState] = React.useState();
    const forceUpdate = React.useCallback(() => updateState(undefined), []);

    const onClickInput = (e) => {
        const name = e.currentTarget.getAttribute('name');
        HttpUtil.windowOpen('library?dialog=true&mode=frame_select', (args: LibraryListDataType) => {
            const selected_data = args;
            const label = selected_data.label;
            const uuid = selected_data.uuid;
            // update
            let {runArgs, updateRunArgs} = props;
            runArgs.flows.forEach((f) => {
                if (f.label == name) {
                    f.value = label;
                    f.uuid = uuid;
                }
                return f;
            });
            updateRunArgs(runArgs);
            forceUpdate();
        });
    };

    const renderAddInputFlowButton = (key, value) => {
        const content = (value) ?
            key + ' : ' + value
            :
            key + ' : 入力ファイルを選択してください';
        return <AddButton
            onClick={(e) => onClickInput(e)} style={style}>
            {content}
        </AddButton>;
    };

    const renderInputFlowForm = () => {
        const {runArgs} = props;

        if (runArgs.flows.length === 0) {
            return null;
        }

        const result: React.ReactNode[] = [];
        for (const f of runArgs.flows) {
            const key = f.label;
            const value = f.value;
            const form = <div key={key} className={style ? style.flow_param : null}>
                <div className={style ? style.left : null}>
                    {renderAddInputFlowButton(key, value)}
                </div>
                <div className={style ? style.right : null}>
                </div>
            </div>;
            result.push(form);
        }

        return result;
    };

    const renderFlowVariableForm = (flow:FlowType) => {
        const params = flow.flow.params;

        if (params.length === 0) {
            return null;
        }

        let forms: React.ReactNode[] = [];
        for (const v of params) {
            const form = <div key={v.name} className={style.flow_param}>
                <div className={style.left}>
                    <input onChange={(e) => {onChangeVariable(e)}}
                        name={v.name}
                        type={'text'} className={style.flow_param_input} placeholder={v.name} />
                </div>
            </div>;
            forms.push(form);
        }

        return <div>
            {forms}
        </div>;
    };

    const onChangeVariable = (e) => {
        const value = e.currentTarget.value;
        const name = e.currentTarget.name;

        let {runArgs, updateRunArgs} = props;
        let vars = runArgs.variables.map((v) => {
            if (v.name == name) {
                v.value = value;
            }
            return v;
        });
        runArgs.variables = vars;
        updateRunArgs(runArgs);
        forceUpdate();
    };

    const {flow} = props;
    const inputFlowForm = renderInputFlowForm();
    const inputVariableForm = renderFlowVariableForm(flow);

    return <div>
        <label className="inputFlow">入力フロー</label>
        {inputFlowForm}
        <label className="inputVar">フロー変数</label>
        {inputVariableForm}
    </div>;
};
