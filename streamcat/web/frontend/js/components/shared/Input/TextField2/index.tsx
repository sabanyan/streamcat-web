import React from 'react';
import { TextField, IconButton } from '@mui/material';
import { FixedField2 } from '../FixedField2';

export type Value = {
    value: string;
    isError: boolean;
};

type Props = {
    label:string;
    type?:'text'|'number'|'password'|'search';
    readOnly?:boolean;
    required?:boolean;
    requiredMessage?:string;
    autoComplete?:'new-password'|'current-password';
    autoFocus?:boolean;
    state?: [Value, (value:React.SetStateAction<Value>)=>void];
    validate?: (value:string) => true|string;
    onChange?:(value:Value) => void;
    onErrorChange?:(isError:boolean) => void;
    onEnterKeyDown?:(value:Value) => void;
};

/**
 * テキストボックス
 * @param props
 */
export const TextField2 = (props:Props) => {
    const {label, readOnly, required, autoComplete, autoFocus, validate} = props;

    // 親コンポーネントで変更可能なvalue.isErrorの値に依存しないよう
    // value.valueの値からエラー状態を判定する
    const isError = (value:string) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        // validate関数が指定されている場合はこの関数で検証する
        return (!!required && !value) || (!!validate && validate(value)!==true);
    };

    // エラー種別に応じてエラーメッセージを取得する
    const errorMessage = (value:string) => {
        // 入力必須のエラーメッセージ
        if(required && !value){
            return props.requiredMessage || '入力必須です';
        }
        // validate関数から返されるエラーメッセージ
        const result = validate && validate(value);
        if(result===undefined || result===true){
            return '';
        }else{
            return result;
        }
    };

    const type = props.type || 'text';
    const [value, setValue] = props.state || [{value:'',isError:isError('')}, () => {}];
    const onChange = props.onChange || (() => {});
    const onErrorChange = props.onErrorChange || (() => {});
    const onEnterKeyDown = props.onEnterKeyDown || (() => {});

    // 入力値の変更の有無
    const [valueChanged, setValueChanged] = React.useState(false);
    // IME未確定の場合はtrue
    const [imeMode, setImeMode] = React.useState(false);
    // 入力値をマスク表示する場合はtrue
    const [hideValue, setHideValue] = React.useState(type==='password');

    // 初期処理
    React.useEffect(() => {
        // value.isErrorに誤った初期値が設定された場合は修正する
        setValue({value:value.value, isError:isError(value.value)});
    }, []);

    // 入力値が変更された時の処理
    const onChangeValue = (e:React.ChangeEvent<HTMLInputElement>) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        const error = isError(e.target.value);
        // 入力値が一度でも変更されたらtrueを設定する
        setValueChanged(true);
        // 入力値を設定する
        setValue({value:e.target.value, isError:error});
        // イベントハンドラを呼び出す
        onChange({value:e.target.value, isError:error});
        // エラー状態が変わった場合はイベントハンドラを呼び出す
        if(error!==isError(value.value)){
            onErrorChange(error);
        }
    };

    // エンターキーの押下でイベントハンドラを呼び出す
    const onDownKey = (key:string, value:string, isError:boolean) => {
        // IME未確定の場合はイベントハンドラを呼び出さない
        if(key==='Enter' && !imeMode){
            onEnterKeyDown({value:value, isError:isError});
        }
    };

    // マスク表示の切り替えボタン
    const maskToggleButton = <IconButton
        edge='end'
        onClick={() => setHideValue(!hideValue)} >
        {hideValue? '👀': '🕶️'}
    </IconButton>;

    return <>{
        readOnly?
        // 
        // 入力不可の場合
        // 
        <FixedField2 label={label} value={value.value} mask={type==='password'} />:
        // 
        // 入力可の場合
        // 
        // フォーカス時にラベルが外側に移動する挙動だが、これを解除するには手間がかかる
        // https://blog.gaji.jp/2020/12/07/5978/
        <TextField  label={label}
                    // 入力値をマスクするにはtype=passwordを設定する
                    type={hideValue? 'password' : type==='password'? 'text': type}
                    // 入力必須記号*の表示する
                    required={required}
                    // Webブラウザの自動入力
                    autoComplete={autoComplete}
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
                    error={valueChanged && isError(value.value)}
                    // エラーメッセージ
                    helperText={valueChanged? errorMessage(value.value): ''}
                    // 入力値
                    value={value.value}
                    // パスワード入力の場合はマスク表示の切り替えボタンを表示する
                    InputProps={
                        type==='password'? {endAdornment: maskToggleButton}: undefined
                    }
                    onChange={onChangeValue}
                    onKeyDown={e => onDownKey(e.key, value.value, isError(value.value))}
                    // IME切替時のイベントハンドラ
                    onCompositionStart={() => setImeMode(true)}
                    onCompositionEnd={() => setImeMode(false)} />
    }</>;
};
