import React from 'react';
import {Checkbox, FormControlLabel, Typography} from '@mui/material';

export type Value = {
    value: boolean;
    isError: boolean;
};

type Props = {
    label: string;
    readOnly?: boolean;
    state?: [Value, (value:React.SetStateAction<Value>)=>void];
    onChange?: (value:Value) => void;
};

export const Checkbox2 = (props:Props) => {
    const {label, readOnly} = props;
    const [value, setValue] = props.state || [{value:false,isError:false}, () => {}];
    const onChange = props.onChange || (() => {});

    // labelとinputタグの紐付けで使用する
    const inputId = React.useId();

    // 初期処理
    React.useEffect(() => {
        // value.isErrorに誤った初期値が設定された場合は修正する
        setValue({value:value.value, isError:false});
    }, []);

    // 入力値が変更された時の処理
    const onChangeValue = (e:React.ChangeEvent<HTMLInputElement>) => {
        // 入力値を設定する
        setValue({value:e.target.checked, isError:false});
        // イベントハンドラを呼び出す
        onChange({value:e.target.checked, isError:false});
    };

    // チェックボックス
    const checkbox = <Checkbox  // WebブラウザConsoleのIssueを抑制するためlabelとinputを紐付ける
                                id={inputId}
                                // 小さく表示する
                                size='small'
                                disabled={readOnly}
                                checked={value.value}
                                onChange={onChangeValue} />;

    return <FormControlLabel
        label={<Typography  variant='caption'
                            color='textSecondary'
                            sx={{lineHeight:'0'}}>{label}</Typography>}
        htmlFor={inputId}
        labelPlacement='end'
        control={checkbox} />;
};
