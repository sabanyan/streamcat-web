import React, {JSX} from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

type Props = {
    dialogTitle?: string;
    control: (openDialog: () => void) => JSX.Element;
    // ボタン
    // (DialogButtonにおいてダイアログの開閉状態を制御したいので
    //  子コンポーネントを生成する関数を引数とする)
    children:[
        (closeDialog: () => void) => JSX.Element[],
        (closeDialog: () => void) => JSX.Element[]
    ];
};

export const Dialog2 = (props:Props) => {
    const {control} = props;
    const dialogTitle = props.dialogTitle || '';
    const [ contents, buttons ] = props.children;

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
        {/* ダイアログを開くコントロール */}
        {control(openDialog)}
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
