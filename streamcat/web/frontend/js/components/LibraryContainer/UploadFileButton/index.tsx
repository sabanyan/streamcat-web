import React from 'react';
import { DatumType, FolderType } from 'Model/Library';
import { DialogButton, FileUploader } from 'Components/shared/Input';
import { useStreamCatNotifications } from 'Components/shared/Notification';

type Props = {
    parent:FolderType;
    onSuccess?:() => void;
};

/**
 * ファイルのアップロードボタン
 * @param props 
 */
export const UploadFileButton = (props:Props) => {
    const { parent, onSuccess } = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    return <DialogButton label='ファイルアップロード'
                         icon='upload'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <FileUploader key='fileUploader'
                          uploadType='document'
                          accept={['text/csv','application/pdf','image/*']}
                          parent={parent}
                          notify={notifySuccess}
                          onSuccess={onSuccess} />
        ],
        // Buttons
        ()=>[]
    ]}</DialogButton>;
};
