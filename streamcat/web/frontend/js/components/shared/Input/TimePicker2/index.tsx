import React from 'react';
import dayjs from 'dayjs';
import ja from 'dayjs/locale/ja';
import {TextField} from '@mui/material';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDayjs from '@mui/lab/AdapterDayjs';
import TimePicker from '@mui/lab/TimePicker';
import { FixedField2 } from '../FixedField2';

export type Value = {
    value: dayjs.Dayjs|null;
    isError: boolean;
};

type Props = {
    label:string;
    readOnly?:boolean;
    required?:boolean;
    requiredMessage?:string;
    state?: [Value, (value:React.SetStateAction<Value>)=>void];
    onChange?:(value:Value) => void;
    onErrorChange?:(isError:boolean) => void;
};

export const TimePicker2 = (props:Props) => {

    const isError = (value:dayjs.Dayjs|null) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        return !!required && !value;
    };

    const {label, readOnly, required} = props;
    const requiredMessage = props.requiredMessage || '入力必須です';
    const [value, setValue] = props.state || [{value:null,isError:isError(null)}, () => {}];
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
    const onChangeValue = (newDate:dayjs.Dayjs|null) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        const error = isError(newDate);
        // 入力値が一度でも変更されたらtrueを設定する
        setValueChanged(true);
        // 入力値を設定する
        setValue({value:newDate, isError:error});
        // イベントハンドラを呼び出す
        onChange({value:newDate, isError:error});
        // エラー状態が変わった場合はイベントハンドラを呼び出す
        if(error!==isError(value.value)){
            onErrorChange(error);
        }
    };

    // 現状ではDay.jsを用いると日付の検証が機能しないようだ
    // https://github.com/mui/material-ui/issues/29838
    return <>{
        readOnly?
        // 
        // 入力不可の場合
        // 
        <FixedField2 label={label} value={value.value?.format('HH:mm') || ''} />:
        // 
        // 入力可の場合
        // 
        <LocalizationProvider dateAdapter={AdapterDayjs} locale={ja} >
        <TimePicker label={label}
                    views={['hours','minutes']}
                    inputFormat='HH:mm'
                    mask='__:__'
                    value={value.value}
                    onChange={onChangeValue}
                    renderInput={params =>
                        <TextField  required={required}
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
                                    error={valueChanged && isError(value.value)}
                                    // エラーメッセージ
                                    helperText={(valueChanged && isError(value.value))? requiredMessage: ''}
                                    {...params} />
                    }
        />
        </LocalizationProvider>
    }</>;
};
