import React from 'react';
import {FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent} from '@mui/material';

export type Value = {
    value: string;
    isError: boolean;
};

export type SelectItem = {
    label: string;
    value: string;
}

type Props = {
    label:string;
    required?:boolean;
    requiredMessage?:string;
    items:SelectItem[];
    state?: [Value, React.Dispatch<React.SetStateAction<Value>>];
    onChange?:(value:Value) => void;
    onErrorChange?:(isError:boolean) => void;
};


export const Select2 = (props:Props) => {
    const {label, required, items} = props;
    const requiredMessage = props.requiredMessage || '入力必須です';
    const [value, setValue] = props.state || [{value:'', isError:false}, () => {}];
    const onChange = props.onChange || (() => {});
    const onErrorChange = props.onErrorChange || (() => {});

    // 入力値の変更の有無
    const [valueChanged, setValueChanged] = React.useState(false);

    // 初期処理
    React.useEffect(() => {
        // 入力必須の場合、初期状態はエラーである
        required && !value.value && setValue({value:value.value, isError:true});
    }, []);

    // 入力値が変更された時の処理
    const onChangeValue = (e:SelectChangeEvent) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        const error = !!required && e.target.value === '';
        // 入力値が一度でも変更されたらtrueを設定する
        setValueChanged(true);
        // 入力値を設定する
        setValue({value:e.target.value, isError:error});
        // イベントハンドラを呼び出す
        onChange({value:e.target.value, isError:error});
        // エラー状態が変わった場合はイベントハンドラを呼び出す
        if(error!==value.isError){
            onErrorChange(error);
        }
    };

    return <FormControl // 入力必須記号*の表示する
                        required={required}
                        // 小さく表示する
                        size='small'
                        // ある程度の横幅を設定する
                        fullWidth={true}
                        // labelの表示域を確保する
                        margin='dense'
                        // 枠線を設定する
                        variant='outlined'
                        // 入力値が空の場合はエラーにする
                        // (未入力時はエラー表示をしない)
                        error={valueChanged && value.isError}>
        <InputLabel>{label}</InputLabel>
        <Select label={label}
                value={value.value}
                onChange={onChangeValue}>
            {/* 引数で指定された選択値 */}
            {items.map(item => <MenuItem value={item.value}>{item.label}</MenuItem>)}
        </Select>
        <FormHelperText>{(valueChanged && value.isError)? requiredMessage: ''}</FormHelperText>
    </FormControl>;
}
