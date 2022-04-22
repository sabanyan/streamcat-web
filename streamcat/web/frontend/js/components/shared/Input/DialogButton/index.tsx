import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Button2 } from "Components/shared/Input";

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
    const [ contents, buttons ] = props.children

    // ダイアログの開閉状態
    const [isOpen, setIsOpen] = React.useState(false);
    // ダイアログを開く
    const openDialog = () => {
        setIsOpen(true);
    };
    // ダイアログを閉じる
    const closeDialog = () => {
        setIsOpen(false);
    };

    return <>
        {/* ダイアログを開くボタン */}
        <Button2 icon={icon}
                large={large}
                disabled={readOnly}
                onClick={openDialog}>{label}</Button2>
        {/* ダイアログ */}
        <Dialog // ある程度の横幅を設定する
                fullWidth={true}
                // ダイアログの開閉状態
                open={isOpen}
                onClose={closeDialog}>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogContent>
                {/* Function as Child Components pattern
                    https://stackoverflow.com/questions/32370994/how-to-pass-props-to-this-props-children */}
                {contents(closeDialog)}
            </DialogContent>
            <DialogActions>
                {buttons(closeDialog)}
            </DialogActions>
        </Dialog>
    </>;
};
