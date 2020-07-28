import React, {useState} from "react";
import {AddButton} from "Shared/Input";
import {HttpUtil} from "Utils/index";
import style from "./style.scss";
import {FlowModelProps} from "Model/Flow/FlowModel";
import {RunArgsType} from "Types/index";

type Props = {
    runArgs: RunArgsType;
    updateRunArgs: Function;
    flow: FlowModelProps
}

const InputFlowForm = (props: Props) => {
    const [, updateState] = React.useState();
    const forceUpdate = React.useCallback(() => updateState({}), []);

    const onClickInput = (e) => {
        const name = e.currentTarget.getAttribute("name");
        HttpUtil.windowOpen("library?dialog=true&mode=frame_select", (args) => {
            const selected_data = args;
            const uuid = selected_data.uuid;
            // update
            let {runArgs, updateRunArgs} = props;
            const flows = runArgs.flows.map((f) => {
                if (f.label == name) {
                    f.uuid = uuid;
                }
                return f;
            });
            runArgs.flows = flows;
            updateRunArgs(runArgs);
            forceUpdate();
        });
    };

    const renderAddInputFlowButton = (key, value) => {
        const content = (value) ?
            key + " : " + value
            :
            key + " : 入力ファイルを選択してください";
        return <AddButton
            name={key}
            onClick={(e) => onClickInput(e)}
            type={"text"} style={style}>
            {content}
        </AddButton>;
    };

    const renderInputFlowForm = () => {
        let {runArgs} = props;

        if (runArgs.length === 0) {
            return null;
        }

        const result: React.ReactNode[] = [];
        for (const f of runArgs.flows) {
            const key = f.label;
            const value = f.uuid;
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

    const renderFlowVariableForm = (flow) => {
        const params = flow.params;

        if (params.length === 0) {
            return null;
        }

        let forms: any[] = [];
        for (const v of params) {
            const form = <div key={v.name} className={style.flow_param}>
                <div className={style.left}>
                    <input onChange={(e) => {
                        onChangeVariable(e);
                    }}
                           name={v.name}
                           type={"text"} className={style.flow_param_input} placeholder={v.name} />
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

export {InputFlowForm};
