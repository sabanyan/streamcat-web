import React from 'react';
import { Dialog2 } from 'Shared/Base/Dialog2'
import { Button2 } from 'Shared/Input';

type Props = {
    label: string;
    dialogTitle?: string;
    icon?: 'add'|'upload'|'trash';
    large?: boolean;
    readOnly?:boolean;
    // ボタン
    // (DialogButtonにおいてダイアログの開閉状態を制御したいので
    //  子コンポーネントを生成する関数を引数とする)
    children:[
        (closeDialog: () => void) => JSX.Element[],
        (closeDialog: () => void) => JSX.Element[]
    ];
};

export const DialogButton = (props:Props) => {
    const {label, icon, large, readOnly} = props;
    const dialogTitle = props.dialogTitle || label;
    const [ contents, buttons ] = props.children;

    // ダイアログを開くボタン
    const button = (openDialog:() => void) =>
        <Button2 icon={icon}
                large={large}
                disabled={readOnly}
                onClick={openDialog}>{label}</Button2>;

    // ダイアログ
    return <Dialog2 dialogTitle={dialogTitle}
                    control={button}>{[
        // Contents
        contents,
        // Buttons
        buttons
    ]}</Dialog2>;
};
