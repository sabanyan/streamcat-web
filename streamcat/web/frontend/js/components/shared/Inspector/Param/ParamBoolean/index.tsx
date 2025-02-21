import React from 'react';
import {CommandParamType} from 'Types/index';
import * as style from './style.scss';

type Props = {
    label?: string;
    param: CommandParamType;
    disabled?: boolean;
    value?: boolean;
    // event
    onChange?: Function; // onChange(e, param)
};

export const ParamBoolean = (props: Props) => {

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
        let result = '';
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

    // FIXIT: なぜチェックボックスのラベルを表示ここで表示させない?
    let labelContainer = (label) ? <React.Fragment>{label}{renderDescription()}</React.Fragment> : null;

    return <React.Fragment>
        <input
            name={param.name}
            className={style.checkbox}
            data-paramtype={param.type}
            type="checkbox"
            checked={value}
            disabled={disabled}
            onChange={(e) => _onChange(e)} />
    </React.Fragment>
};
