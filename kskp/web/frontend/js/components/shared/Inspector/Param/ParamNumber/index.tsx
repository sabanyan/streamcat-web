//@flow
import React from "react";
import {CommandParamType} from "Types/index";
//import classnames from 'classnames'

type Props = {
    param: CommandParamType;
    events?: {
        onChange?: Function;
    };
    defaultValue: any;
    refValue?: any;
    disabled?: boolean;
    onBuild?: Function;
}

const ParamNumber = (props: Props) => {
    const onChange = (e) => {
        const {param, events} = props;

        if (events && events.onChange) {
            const onChange = events.onChange;
            onChange(e, param);
        }
    };

    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    const {param, onBuild, defaultValue, refValue, disabled} = props;
    let inputRef = refValue;
    if (onBuild) {
        inputRef = element => onBuild(param, element);
    }

    const label = (param.label) ? param.label : param.name;
    return <div>
        <label>
            {label}
        </label>
        <input name={param.name} type="text" className="form-control" placeholder={param.name}
               defaultValue={defaultValue}
               ref={inputRef} disabled={disabled} onChange={(e) => onChange(e)} />
    </div>;

};

export {ParamNumber};
