import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ErrorResponse } from 'Utils/APIUtil2';
import { FolderType } from 'Model/Library';
import { useStreamCatNotifications } from 'Components/shared/Notification';
import { FlatButton, TextField2 } from 'Components/shared/Input';
import { Value } from 'Components/shared/Input/TextField2';

type Props = {
    parent:FolderType;
    onSuccess:(newFolder:FolderType) => void;
};

/**
 * フォルダの追加ボタン
 * @param props 
 */
export const CreateFolderButton = (props:Props) => {
    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();
    // 空の入力値
    const emptyValue:Value = {value:'', isError:false}

    // ダイアログの開閉状態
    const [isOpen, setIsOpen] = React.useState(false);
    // 追加ボタンの押下可否
    const [isDialogError, setIsDialogError] = React.useState(true);
    // ダイアログを開く
    const openDialog = () => {
        setIsOpen(true);
    };
    // ダイアログを閉じる
    const closeDialog = () => {
        // 全ての状態変数を初期化する
        setIsOpen(false);
        setIsDialogError(true);
        setLabel(emptyValue);
    };

    // テキストボックスの入力値
    const [label, setLabel] = React.useState(emptyValue);
    // テキストボックスのエラー状態が変更された時、追加ボタンの押下可否を更新する
    const onErrorChange = (isError:boolean) => {
        setIsDialogError(isError);
    };
    // エンターキーの押下処理
    const onEnterKeyPress = (value:Value) => {
        // フォルダを新規作成する
        onClickCreate(value.value);
    };

    // 追加ボタンの押下処理
    const onClickCreate = (label:string) => {
        const {parent, onSuccess} = props;
        // エラーの場合は処理を中断する
        if(isDialogError){
            return;
        }
        // フォルダを新規作成する
        parent.createFolder(label).then(folder => {
            notifySuccess('フォルダを作成しました', folder.label);
            // ダイアログを閉じる
            closeDialog();
            // イベントハンドラを呼び出す
            onSuccess(folder);
        }).catch((error:ErrorResponse) => {
            notifyError('フォルダ作成エラー', error.message);
        });
    };

    return <>
        {/* ボタン */}
        <FlatButton icon={'icon-add'} onClick={openDialog}>フォルダの追加</FlatButton>
        {/* ダイアログ */}
        <Dialog // ある程度の横幅を設定する
                fullWidth={true}
                // ダイアログの開閉状態
                open={isOpen}
                onClose={closeDialog}>
            <DialogTitle>フォルダの追加</DialogTitle>
            <DialogContent>
                <TextField2 label='フォルダ名'
                            required={true}
                            autoFocus={true}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />
            </DialogContent>
            <DialogActions>
                <Button onClick={closeDialog}>キャンセル</Button>
                <Button disabled={isDialogError}
                        onClick={() => onClickCreate(label.value)}>追加する</Button>
            </DialogActions>
        </Dialog>
    </>;
};
