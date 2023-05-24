import React from "react";
import HttpUtil from "Utils/HttpUtil";
import { TextField } from "@mui/material";
import { FlowType, FolderType } from "Model/Library";
import { LinkField } from "Shared/Input";
import { WebUtil } from "Utils/index";

export type Value = {
    value: FlowType|null;
    isError: boolean;
};

type Props = {
    label:string;
    readOnly?:boolean;
    required?:boolean;
    requiredMessage?:string;
    parent: FolderType;
    state?: [Value, (value:React.SetStateAction<Value>)=>void];
    onChange?:(value:Value) => void;
    onErrorChange?:(isError:boolean) => void;
};

export const FlowLinkField = (props:Props) => {
    const {label, readOnly, required, parent} = props;
    const requiredMessage = props.requiredMessage || '入力必須です';
    const [value, setValue] = props.state || [{value:null,isError:false}, () => {}];
    const onChange = props.onChange || (() => {});
    const onErrorChange = props.onErrorChange || (() => {});

    const isError = (value:FlowType|null) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        return !!required && !value;
    };

    // 入力値の変更の有無
    const [valueChanged, setValueChanged] = React.useState(false);

    // 初期処理
    React.useEffect(() => {
        // value.isErrorに誤った初期値が設定された場合は修正する
        setValue({value:value.value, isError:isError(value.value)});
    }, []);

    const getApiPath = (uuid:string):string => {
        if(inject_folder_uuid || inject_is_trash){
            // ルートフォルダ以外の場合
            return {
                project:`projects/${uuid}`,
                folder: `folders/${uuid}`,
                trash:  `trashes`
            }[parent.type];
        }else{
            // ルートフォルダの場合
            return `library`;
        }
    };

    // 入力値が変更された時の処理
    const onChangeValue = (flow:FlowType|null) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        const error = isError(flow);
        // 入力値が一度でも変更されたらtrueを設定する
        setValueChanged(true);
        // 入力値を設定する
        setValue({value:flow, isError:error});
        // イベントハンドラを呼び出す
        onChange({value:flow, isError:error});
        // エラー状態が変わった場合はイベントハンドラを呼び出す
        if(error!==isError(value.value)){
            onErrorChange(error);
        }
    };

    const onClickSelect = () => {
        // 移動先選択ダイアログを表示する
        HttpUtil.windowOpen(
            // フロー選択ダイアログは、現在の位置のフォルダを初期表示する
            getApiPath(parent.uuid) + '?dialog=true&mode=flow_select',
            // 選択したフローを保持する
            flow => onChangeValue(flow)
        );
    };

    const openFlow = () => {
        if(!value.value){
            return;
        }
        window.open(WebUtil.webURL(`/flows/${value.value.uuid}`));
    };

    // TODO: フローのフォルダパスを表示したいが、
    // APIでそれを取得すると遅くなるため暫定的にラベル名を表示する
    const flowPath = value.value?.label || '';

    return <>{
        readOnly?
        // 
        // 入力不可の場合
        // 
        <LinkField label={label} value={flowPath} onClick={openFlow} />:
        // 
        // 入力可の場合
        //
        <TextField  label={label}
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
                    value={flowPath}
                    // テキストフィールドへのキー入力を無効にする
                    onChange={()=>{}}
                    onKeyPress={onClickSelect}
                    onClick={onClickSelect} />
    }</>;
};
