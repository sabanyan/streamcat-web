import React from 'react';
import {FormControl,
        FormHelperText,
        InputLabel,
        MenuItem,
        Select,
        SelectChangeEvent,
        Typography} from '@mui/material';

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
    readOnly?:boolean;
    required?:boolean;
    requiredMessage?:string;
    items:SelectItem[];
    state?: [Value, React.Dispatch<React.SetStateAction<Value>>];
    onChange?:(value:Value) => void;
    onErrorChange?:(isError:boolean) => void;
};

/**
 * セレクトボックス
 * @param props
 */
export const Select2 = (props:Props) => {

    // 親コンポーネントで変更可能なvalue.isErrorの値に依存しないよう
    // value.valueの値からエラー状態を判定する
    const isError = (value:string) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        return !!required && !value;
    };

    const {label, readOnly, required, items} = props;
    const requiredMessage = props.requiredMessage || '入力必須です';
    const [value, setValue] = props.state || [{value:'',isError:isError('')}, () => {}];
    const onChange = props.onChange || (() => {});
    const onErrorChange = props.onErrorChange || (() => {});

    // 入力値の変更の有無
    const [valueChanged, setValueChanged] = React.useState(false);

    // 初期処理
    React.useEffect(() => {
        // value.isErrorに誤った初期値が設定された場合は修正する
        setValue({value:value.value, isError:isError(value.value)});
    }, []);

    // 入力値が変更された時の処理
    const onChangeValue = (e:SelectChangeEvent) => {
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

    return <>{
        readOnly?
        // 
        // 入力不可の場合
        // 
        <>
            <Typography variant='caption'
                        color='textSecondary'
                        sx={{lineHeight:'0'}}>{label}</Typography>
            <Typography variant="body1"
                        color="textPrimary"
                        sx={{lineHeight:'1',
                            paddingLeft:1,
                            paddingBottom:1}}>{value.value}</Typography>
        </>:
        // 
        // 入力可の場合
        // 
        <FormControl    // 入力必須記号*の表示する
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
                        error={valueChanged && isError(value.value)}>
            <InputLabel>{label}</InputLabel>
            <Select label={label}
                    // 入力値
                    value={value.value}
                    onChange={onChangeValue}>
                {/* 引数で指定された選択値 */}
                {items.map((item,index) => <MenuItem key={index} value={item.value}>{item.label}</MenuItem>)}
            </Select>
        <FormHelperText>{(valueChanged && isError(value.value))? requiredMessage: ''}</FormHelperText>
        </FormControl>
    }</>;
};
