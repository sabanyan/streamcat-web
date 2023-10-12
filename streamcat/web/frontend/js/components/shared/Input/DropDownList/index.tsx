//@flow
import React from 'react';
import style from './style.scss';
import classnames from 'classnames';
import {dropDownListItem} from 'Types/index';

type Props = {
    onChange: Function;
    label?: string;
    list: dropDownListItem[];
    value: string;
    hiddenNoSelect?: boolean;
    onClickAction?: Function;
    actionLabel?: string;
    disabled?: boolean;
};

export const DropDownList = (props: Props) => {
    const {label, list, onChange, value, disabled, hiddenNoSelect, onClickAction, actionLabel} = props

    /**
     * 選択されたoptionを返す
     */
    const getDataFromList = (value: string) => {
        const found = list.find(data => data.value === value);
        if(found){
            return found;
        }else{
            return {
                label: '選択してください',
                object: null,
                value: null,
            }
        }
    };
    
    let options: React.ReactNode[] = []
    let index = 0
    for (const data of list.values()) {
        options.push(<option key={index + 1} value={data.value}>{data.label}</option>)
        index++;
    }

    let labelElement = <></>;
    if (label) {
        labelElement = <span className={style.label}>{label}</span>
    }

    if (!hiddenNoSelect) {
        options.unshift(<option key={0} value={''}>選択してください</option>)
    }

    let action = <></>;
    if(onClickAction){
        action = <a href="#" onClick={(e) => onClickAction(e)} className={style.actionLabel}>{actionLabel}</a>
    }
    
    return <div className={classnames(style.dropdownListContainer, {[style.action]: (onClickAction)})}>
        {labelElement}
        <select className={classnames(style.dropdownList, {[style.hasLabel]: (label)})}
                disabled={disabled}
                // defaultValue={defaultValue}
                value={value}
                onChange={(e) => onChange(e, getDataFromList(e.target.value), label)}>{options}</select>
        {action}
    </div>;
};
