import React from "react";
import {CommandParamType} from "Types/index";
import style from "./style.scss";

type Props = {
    label?: string;
    param: CommandParamType;
    disabled?: boolean;
    value?: boolean;
    // event
    onChange?: Function; // onChange(e, param)
}


const ParamBoolean = (props: Props) => {

    const _onChange = (e) => {
        try {
            const {param, onChange} = props;
            let value = e.currentTarget.checked;
            if (onChange) onChange(e, param, value);
        } catch (e) {
            console.log(e);
        }
    };

    const renderDescription = () => {
        let result = undefined;
        try {
            const {param} = props;
            if (param.description) {
                result = param.description;
            }
        } catch (e) {
            console.log(e);
        }

        return <p className={style.description}>
            {result}
        </p>;
    };

    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    const {label, param, disabled, value} = props;

    const isDisabled = (disabled);
    const isChecked = (value);
    let labelContainer = (label) ? <React.Fragment>{label}{renderDescription()}</React.Fragment> : null;

    return <div className={style.param}>
        <label className={style.label}>
            <input
                name={param.name}
                className={style.checkbox}
                data-paramtype={param.type}
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={(e) => _onChange(e)} />
            {labelContainer}
        </label>
    </div>;
};


export {ParamBoolean}
