import React from "react"
import { Box } from "@mui/material"
import { useStreamCatNotifications } from 'Components/shared/Notification';
import { ErrorResponse } from 'Utils/APIUtil2';
import { DatumType } from "Model/Library";
import { Button2 } from "Components/shared/Input";
import { Value } from 'Components/shared/Input/TextField2';

type Props = {
    // Datumを新規追加する場合はtrue
    createMode?: boolean;
    // EditBoxの状態を初期化するためのトリガー
    datum: DatumType;
    // 入力値
    values: Value[];
    // 入力値の初期化処理
    initValues: () => void;
    // Datumを新規追加する処理
    create: () => Promise<DatumType>;
    // Datumを変更する処理
    update: () => Promise<DatumType>;
    // 新規追加/変更後の処理
    onSuccess: (datum:DatumType) => void;
    // 入力コンポーネント
    // (EditBoxにおいてreadOnlyとonErrorChangeを制御したいので
    //  子コンポーネントを生成する関数を引数とする)
    children:[
                JSX.Element[],
                (readOnly: boolean,
                 onErrorChange: (isError:boolean) => void,
                 onEnterKeyPress: (value:Value) => void
                ) => JSX.Element[]
             ];
};

/**
 * 新規追加/変更可能なBox
 * @param props 
 */
export const EditBox = (props:Props) => {
    const { datum, values, initValues, create, update, onSuccess } = props;
    const createMode = !!props.createMode;
    const [ buttons, inputs ] = props.children

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // ペインの変更可否
    const [readOnly, setReadOnly] = React.useState(!createMode);
    // 追加ボタンの押下可否
    const [isDrawerError, setIsDrawerError] = React.useState(createMode);

    // useState()の初期値はdatumの値が変更されても変更されないため、ここで変更する必要がある
    React.useEffect(() => {
        // datumの変更に応じて表示値を変更する
        initValues();
        // datum、またはcreateの変更に応じてreadOnlyを変更する
        setReadOnly(!createMode);
        setIsDrawerError(createMode);
    }, [datum,createMode]);

    // テキストボックスのエラー状態が変更された時、確定ボタンの押下可否を更新する
    const onErrorChange = (isError:boolean) => {
        if(isError){
            // エラーの場合は、確定ボタンを無効にする
            setIsDrawerError(true);
        }else{
            // エラー状態の変更前における、全てのエラー状態のテキストボックスを数える
            const errorCount = values.filter(value => value.isError).length;
            // このイベントハンドラを呼び出したテキストボックスの変更前のエラー状態は、trueなのでその分を引く
            (errorCount - 1) === 0 && setIsDrawerError(false);
        }
    };

    // エンターキーの押下処理
    const onEnterKeyPress = (value:Value) => {
        createMode? createDatum(): updateDatum();
    };

    // キャンセルボタン押下時の処理
    const onClickClear = () => {
        // 全ての状態変数を初期化する
        setReadOnly(!createMode);
        setIsDrawerError(createMode);
        initValues();
    };

    // 確定ボタン押下時の処理
    const submit = () => {
        createMode? createDatum(): updateDatum();
    };

    // Datumの新規作成処理
    const createDatum = () => {
        // エラーの場合は処理を中断する
        if(isDrawerError){
            return;
        }
        // リモートフォルダを新規作成する
        create().then(folder => {
            notifySuccess('リモートフォルダを作成しました', folder.label);
            // ペインを変更不可にする
            setReadOnly(true);
            // イベントハンドラを呼び出す
            onSuccess(folder);
        }).catch((error:ErrorResponse) => {
            notifyError('リモートフォルダ作成エラー', error.message);
        });
    };

    // Datumの変更処理
    const updateDatum = () => {
        // エラーの場合は処理を中断する
        if(isDrawerError){
            return;
        }
        // リモートフォルダを変更する
        update().then(folder => {
            notifySuccess('リモートフォルダを変更しました', folder.label);
            // ペインを変更不可にする
            setReadOnly(true);
            // イベントハンドラを呼び出す
            onSuccess(folder);
        }).catch((error:ErrorResponse) => {
            notifyError('リモートフォルダ変更エラー', error.message);
        });
    };

    return <>
        {
            readOnly?
            <Box>
                <Button2 onClick={()=>setReadOnly(false)}>変更</Button2>
                {buttons}
            </Box>:
            <Box>
                <Button2 onClick={onClickClear}>キャンセル</Button2>
                <Button2 disabled={isDrawerError} onClick={submit}>確定</Button2>
            </Box>
        }
        {/* Function as Child Components pattern
            https://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children */}
        {inputs(readOnly, onErrorChange, onEnterKeyPress)}
    </>;

};
