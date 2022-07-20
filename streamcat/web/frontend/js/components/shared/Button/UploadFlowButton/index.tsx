import React from 'react';
import { FolderType } from 'Model/Library';
import { DialogButton, FileUploader } from 'Shared/Input';
import { useStreamCatNotifications } from 'Shared/Notification';

type Props = {
    parent:FolderType;
    onSuccess?:() => void;
};

/**
 * フローのアップロードボタン
 * @param props 
 */
export const UploadFlowButton = (props:Props) => {
    const { parent, onSuccess } = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    return <DialogButton label='フローのアップロード'
                         icon='upload'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <FileUploader key='fileUploader'
                          uploadType='flow'
                          accept={['.tgz']}
                          parent={parent}
                          notify={notifySuccess}
                          onSuccess={onSuccess} />
        ],
        // Buttons
        ()=>[]
    ]}</DialogButton>;
};
