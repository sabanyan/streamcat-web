import React from 'react';
import { Box } from '@mui/material';
import { useStreamCatNotifications } from 'Shared/Notification';
import { ErrorResponse } from 'Api';
import { DatumType } from 'Model/Library';
import { UserType, SelfUserType } from 'Model/Navigation/NavigationModel';
import { typeNames } from 'Utils/TypeNames';
import { AwaitButton, Button2 } from 'Shared/Input';

type Value = {
    value: any;
    isError: boolean;
};

type Props<T> = {
    readOnly?: boolean;
    // Datumを新規追加する場合はtrue
    createMode?: boolean;
    // EditBoxの状態を初期化するためのトリガー
    datum?: T;
    // 入力値
    values: Value[];
    // 入力値の初期化処理
    initValues: () => void;
    // Datumを新規追加する処理
    create: () => Promise<T>;
    // Datumを変更する処理
    update?: () => Promise<T>;
    // 新規追加/変更後の処理
    onSuccess: (datum:T) => void;
    // 変更ボタン押下時の処理
    onEdit?: () => void;
    // キャンセルボタン押下時の処理
    onCancel?: () => void;
    // 入力コンポーネント
    // (EditBoxにおいてreadOnlyとonErrorChangeを制御したいので
    //  子コンポーネントを生成する関数を引数とする)
    children:[
        (   readonly: boolean,
        ) => JSX.Element[],
        (   readOnly: boolean,
            onErrorChange: (isError:boolean) => void,
            onEnterKeyDown: (value:Value) => void
        ) => JSX.Element[]
    ];
};

/**
 * 新規追加/変更可能なBox
 * @param props 
 */
export const EditBox = <T extends DatumType|UserType|SelfUserType|void = DatumType>(props:Props<T>) => {
    const { datum, values, initValues, create, update, onSuccess, onEdit, onCancel } = props;
    const readOnly = !!props.readOnly;
    const createMode = !!props.createMode;
    const [ buttons, inputs ] = props.children;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // ペインの変更可否
    const [editMode, setEditMode] = React.useState(createMode);
    // 追加ボタンの押下可否
    const [editBoxError, setEditBoxError] = React.useState(createMode);

    // useState()の初期値はdatumの値が変更されても変更されないため、ここで変更する必要がある
    React.useEffect(() => {
        // datumの変更に応じて表示値を変更する
        initValues();
        // datum、またはcreateの変更に応じてreadOnlyを変更する
        setEditMode(createMode);
        setEditBoxError(createMode);
    }, [datum]);

    /**
     * テキストボックスのエラー状態が変更された時、確定ボタンの押下可否を更新する
     * @param isError エラー状態
     * @param prevIsError 直前のエラー状態(Tabsの切り替え時にfalseを指定するため)
     */
    const onErrorChange = (isError:boolean, prevIsError=true) => {
        if(isError){
            // エラーの場合は、確定ボタンを無効にする
            setEditBoxError(true);
        }else{
            // エラー状態の変更前における、全てのエラー状態のテキストボックスを数える
            const errorCount = values.filter(value => value.isError).length;
            // このイベントハンドラを呼び出したテキストボックスの変更前のエラー状態は、trueなのでその分を引く
            const myPrevErrorCount = prevIsError? 1: 0;
            setEditBoxError((errorCount - myPrevErrorCount) > 0);
        }
    };

    // 変更ボタン押下時の処理
    const onClickEdit = () => {
        // ペインの変更可能にする
        setEditMode(true);
        return new Promise<void>(() => {
            // イベントハンドラを呼び出す
            onEdit && onEdit();
        });
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
            return Promise.resolve();
        }
        // 新規追加、または変更を行う
        return createMode? createDatum(): updateDatum();
    };

    // 通知メッセージとonSuccess()の呼び出し
    const notifyAndOnSuccess = (datum:T, methodName:string) => {
        if(!datum){
            return;
        }
        const typeLabel = typeNames[datum.type];
        const label = datum.type==='user'? datum.name: datum.label;
        notifySuccess(`${typeLabel}を${methodName}しました`, label);
        // イベントハンドラを呼び出す
        onSuccess(datum);
    };

    // Datumの新規作成処理
    const createDatum = () => {
        // Datumを新規作成する
        return create().then(datum => {
            // ペインを変更不可にする
            setEditMode(false);
            // Promise.all([])が渡された場合、datumはundefinedになる
            notifyAndOnSuccess(datum, '作成');
        }).catch((error:ErrorResponse) => {
            notifyError(`作成エラー`, error.message);
        });
    };

    // Datumの変更処理
    const updateDatum = () => {
        if(!update){
            // updateが指定されていない場合、処理を中断する
            return Promise.resolve();
        }
        // Datumを変更する
        return update().then(datum => {
            // ペインを変更不可にする
            setEditMode(false);
            // Promise.all([])が渡された場合、datumはundefinedになる
            notifyAndOnSuccess(datum, '変更');
        }).catch((error:ErrorResponse) => {
            notifyError(`変更エラー`, error.message);
        });
    };

    // Datumの更新可否
    // NOTE: Userはallowlistを持ってないのでreadOnly値だけで更新可否を判定する
    const allowUpdate = datum && (datum.type==='user'? true: datum.allowlist.update);
    const enabled = allowUpdate && !readOnly;

    // 変更ボタン
    const editbuttons = (align:'left'|'right') => {
        if(editMode){
            return <Box textAlign={align}>
                {createMode? buttons(!editMode): []}
                <Button2 onClick={onClickCancel}>キャンセル</Button2>
                <AwaitButton disabled={editBoxError} onClick={submit}>確定</AwaitButton>
                {createMode? []: buttons(!editMode)}
            </Box>;
        }else{
            return <Box textAlign={align}>
                <AwaitButton disabled={!enabled} onClick={onClickEdit}>変更</AwaitButton>
                {buttons(!editMode)}
            </Box>;
        }
    };

    return <>
        {/* 変更モードの場合はボタンを左上に配置する */}
        {createMode? <></>: editbuttons('left')}
        {/* Function as Child Components pattern
            https://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children */}
        {inputs(!editMode, onErrorChange, submit)}
        {/* 新規追加モードの場合はボタンを右下に配置する */}
        {createMode? editbuttons('right'): <></>}
    </>;
};
