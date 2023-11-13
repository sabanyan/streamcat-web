import React from 'react';
import { TextField } from '@mui/material';

export type Value = {
    value: File|null;
    isError: boolean;
};

type Props = {
    label:string;
    // readOnly?:boolean;
    required?:boolean;
    requiredMessage?:string;
    accepts?: string[];
    state?: [Value, (value:React.SetStateAction<Value>)=>void];
    onChange?:(value:Value) => void;
    onErrorChange?:(isError:boolean) => void;
};

export const FileField = (props:Props) => {
    const {label, required, accepts} = props;
    const requiredMessage = props.requiredMessage || '入力必須です';
    const [value, setValue] = props.state || [{value:null,isError:false}, () => {}];
    const onChange = props.onChange || (() => {});
    const onErrorChange = props.onErrorChange || (() => {});

    const isError = (value:File|null) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        return !!required && !value;
    };

    // 入力値の変更の有無
    const [valueChanged, setValueChanged] = React.useState(false);
    // 隠しinputタグへの参照
    const hiddenFileInput = React.useRef<HTMLInputElement>(null);

    // 初期処理
    React.useEffect(() => {
        // value.isErrorに誤った初期値が設定された場合は修正する
        setValue({value:value.value, isError:isError(value.value)});
    }, []);

    // 入力値が変更された時の処理
    const onChangeValue = (files:FileList|null) => {
        // ファイルは単一選択に制限している
        const file = files && files[0];
        // 入力必須、かつ入力値が空の場合はエラーにする
        const error = isError(file);
        // 入力値が一度でも変更されたらtrueを設定する
        setValueChanged(true);
        // 入力値を設定する
        setValue({value:file, isError:error});
        // イベントハンドラを呼び出す
        onChange({value:file, isError:error});
        // エラー状態が変わった場合はイベントハンドラを呼び出す
        if(error!==isError(value.value)){
            onErrorChange(error);
        }
    };

    const onClickField = () => {
        // TextFieldが押下されたら隠しinputを押下する
        hiddenFileInput.current && hiddenFileInput.current.click();
    };

    // 選択したファイル名
    const fileName = value.value?.name || '';

    // 選択可能なファイルタイプ
    const accept = accepts? accepts.join(','): undefined;

    return <><TextField
        label={label}
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
        // 入力値が空の場合はエラーにする
        // (未入力時はエラー表示をしない)
        error={valueChanged && isError(value.value)}
        // エラーメッセージ
        helperText={(valueChanged && isError(value.value))? requiredMessage: ''}
        // 入力値
        value={fileName}
        // テキストフィールドへのキー入力を無効にする
        onChange={()=>{}}
        onKeyDown={onClickField}
        onClick={onClickField} />
        {/* ファイルアップロード入力にはshowOpenFilePicker()を使う方法もあるがFirefoxとSafariは対応していない */}
        <input  type='file'
                ref={hiddenFileInput}
                // 不可視にする
                style={{display:'none'}}
                // ファイルは単一選択
                multiple={false}
                // 選択可能なファイルタイプ
                accept={accept}
                onChange={e => onChangeValue(e.target.files)} />
    </>;
};
