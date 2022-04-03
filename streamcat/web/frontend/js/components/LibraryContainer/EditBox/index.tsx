import React from "react"
import { Box } from "@mui/material"
import { useStreamCatNotifications } from 'Components/shared/Notification';
import { ErrorResponse } from 'Utils/APIUtil2';
import { DatumType } from "Model/Library";
import LibraryUtil from "Utils/LibraryUtil";
import { Button2 } from "Components/shared/Input";
import { Value } from 'Components/shared/Input/TextField2';

type Props = {
    readOnly?: boolean;
    // Datumを新規追加する場合はtrue
    createMode?: boolean;
    // EditBoxの状態を初期化するためのトリガー
    datum?: DatumType;
    // 入力値
    values: Value[];
    // 入力値の初期化処理
    initValues: () => void;
    // Datumを新規追加する処理
    create: () => Promise<DatumType>;
    // Datumを変更する処理
    update?: () => Promise<DatumType>;
    // 新規追加/変更後の処理
    onSuccess: (datum:DatumType) => void;
    // キャンセルボタン押下時の処理
    onCancel?: () => void;
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
    const { datum, values, initValues, create, update, onSuccess, onCancel } = props;
    const readOnly = !!props.readOnly;
    const createMode = !!props.createMode;
    const [ buttons, inputs ] = props.children

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // ペインの変更可否
    const [editMode, setEditMode] = React.useState(!createMode);
    // 追加ボタンの押下可否
    const [editBoxError, setEditBoxError] = React.useState(createMode);

    // useState()の初期値はdatumの値が変更されても変更されないため、ここで変更する必要がある
    React.useEffect(() => {
        // datumの変更に応じて表示値を変更する
        initValues();
        // datum、またはcreateの変更に応じてreadOnlyを変更する
        setEditMode(createMode);
        setEditBoxError(createMode);
    }, [datum,createMode]);

    // テキストボックスのエラー状態が変更された時、確定ボタンの押下可否を更新する
    const onErrorChange = (isError:boolean) => {
        if(isError){
            // エラーの場合は、確定ボタンを無効にする
            setEditBoxError(true);
        }else{
            // エラー状態の変更前における、全てのエラー状態のテキストボックスを数える
            const errorCount = values.filter(value => value.isError).length;
            // このイベントハンドラを呼び出したテキストボックスの変更前のエラー状態は、trueなのでその分を引く
            (errorCount - 1) === 0 && setEditBoxError(false);
        }
    };

    // キャンセルボタン押下時の処理
    const onClickCancel = () => {
        // 全ての状態変数を初期化する
        setEditMode(createMode);
        setEditBoxError(createMode);
        initValues();
        // イベントハンドラを呼び出す
        onCancel && onCancel();
    };

    // 確定ボタン押下時の処理
    const submit = () => {
        // エラーの場合は処理を中断する
        if(editBoxError){
            return;
        }
        // 新規追加、または変更を行う
        createMode? createDatum(): updateDatum();
    };

    // Datumの新規作成処理
    const createDatum = () => {
        // リモートフォルダを新規作成する
        create().then(datum => {
            // ペインを変更不可にする
            setEditMode(false);
            // Promise.all([])が渡された場合、datumはundefinedになる
            if(datum){
                const typeLabel = LibraryUtil.getTypeLabel(datum.type);
                notifySuccess(`${typeLabel}を作成しました`, datum.label);
                // イベントハンドラを呼び出す
                onSuccess(datum);
            }
        }).catch((error:ErrorResponse) => {
            notifyError(`作成エラー`, error.message);
        });
    };

    // Datumの変更処理
    const updateDatum = () => {
        if(!update){
            // updateが指定されていない場合、処理を中断する
            return;
        }
        // リモートフォルダを変更する
        update().then(datum => {
            // ペインを変更不可にする
            setEditMode(false);
            // Promise.all([])が渡された場合、datumはundefinedになる
            if(datum){
                const typeLabel = LibraryUtil.getTypeLabel(datum.type);
                notifySuccess(`${typeLabel}を変更しました`, datum.label);
                // イベントハンドラを呼び出す
                onSuccess(datum);
            }
        }).catch((error:ErrorResponse) => {
            notifyError(`変更エラー`, error.message);
        });
    };

    // Datumの更新可否
    const enabled = datum && datum.allowlist.update && !readOnly;

    // 変更ボタン
    const EditButton = (props:{align:'left'|'right'}) => {
        if(editMode){
            return <Box textAlign={props.align}>
                <Button2 onClick={onClickCancel}>キャンセル</Button2>
                <Button2 disabled={editBoxError} onClick={submit}>確定</Button2>
            </Box>;
        }else{
            return <Box textAlign={props.align}>
                <Button2 disabled={!enabled} onClick={()=>setEditMode(true)}>変更</Button2>
                {buttons}
            </Box>;
        }
    }

    return <>
        {/* 変更モードの場合はボタンを左上に配置する */}
        {createMode? <></>: <EditButton align='left'/>}
        {/* Function as Child Components pattern
            https://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children */}
        {inputs(!editMode, onErrorChange, submit)}
        {/* 新規追加モードの場合はボタンを右下に配置する */}
        {createMode? <EditButton align='right'/>: <></>}
    </>;
};
