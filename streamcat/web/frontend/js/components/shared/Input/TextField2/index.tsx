import React from 'react';
import {TextField} from '@mui/material';

export type Value = {
    value: string;
    isError: boolean;
};

type Props = {
    label:string;
    type?:'text'|'number'|'password'|'search';
    required?:boolean;
    requiredMessage?:string;
    autoFocus?:boolean;
    state?: [Value, React.Dispatch<React.SetStateAction<Value>>];
    onChange?:(value:Value) => void;
    onErrorChange?:(isError:boolean) => void;
    onEnterKeyPress?:(value:Value) => void;
};

/**
 * テキストボックス
 * @param props
 */
export const TextField2 = (props:Props) => {
    const {label, required, autoFocus} = props;
    const type = props.type || 'text';
    const requiredMessage = props.requiredMessage || '入力必須です';
    const [value, setValue] = props.state || [{value:'', isError:false}, () => {}];
    const onChange = props.onChange || (() => {});
    const onErrorChange = props.onErrorChange || (() => {});
    const onEnterKeyPress = props.onEnterKeyPress || (() => {});

    // 入力値の変更の有無
    const [valueChanged, setValueChanged] = React.useState(false);

    // 初期処理
    React.useEffect(() => {
        // 入力必須の場合、初期状態はエラーである
        required && !value.value && setValue({value:value.value, isError:true});
    }, []);

    // 入力値が変更された時の処理
    const onChangeValue = (e:React.ChangeEvent<HTMLInputElement>) => {
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

    // エンターキーの押下でイベントハンドラを呼び出す
    const onPressKey = (key:string, value:string, isError:boolean) => {
        if(key==='Enter'){
            onEnterKeyPress({value:value, isError:isError});
        }
    };

    // フォーカス時にラベルが外側に移動する挙動だが、これを解除するには手間がかかる
    // https://blog.gaji.jp/2020/12/07/5978/
    return <TextField
        label={label}
        type={type}
        // 入力必須記号*の表示する
        required={required}
        // 小さく表示する
        size='small'
        // ある程度の横幅を設定する
        fullWidth={true}
        // labelの表示域を確保する
        margin='dense'
        // 枠線を設定する
        variant='outlined'
        // 表示時にフォーカスする
        autoFocus={autoFocus}
        // 入力値が空の場合はエラーにする
        // (未入力時はエラー表示をしない)
        error={valueChanged && value.isError}
        // エラーメッセージ
        helperText={(valueChanged && value.isError)? requiredMessage: ''}
        value={value.value}
        onChange={onChangeValue}
        onKeyPress={e => onPressKey(e.key, value.value, value.isError)}
    />;
};
