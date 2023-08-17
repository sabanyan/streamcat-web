import React from 'react';
import {Box} from '@mui/material';
import { Drawer2 } from 'Shared/Input';
import { DatumType, FolderType, FlowType, FrameType, DocumentType } from 'Model/Library';
import { MoveButton } from 'Shared/Button/MoveButton';
import { DeleteButton } from 'Shared/Button/DeleteButton';
import { DownloadFlowButton } from 'Shared/Button/DownloadFlowButton';
import { DownloadFileButton } from 'Shared/Button/DownloadFileButton';
import { EditLockSwitch } from 'Shared/Input/EditLockSwitch';

type Props = {
    parent: FolderType;
    data: DatumType[];
    onSuccess: (data:DatumType[]) => void;
};

export const MultiDataDrawer = (props:Props) => {
    const { parent, data, onSuccess } = props;

    // 全てフローの場合にtrue
    const flowAll = data.every(datum => datum.type==='flow');
    // 全てのDatumについて、フローのダウンロードが可能な場合にtrue
    const flowLikeAll = !flowAll && 
                        data.every(datum => ['project','folder','flow'].includes(datum.type));
    // 全てファイルの場合にtrue
    const fileAll = !flowAll &&
                    !flowLikeAll &&
                    data.every(datum => ['frame','document'].includes(datum.type));

    return <Drawer2>
        <MoveButton parent={parent} targets={data} onSuccess={onSuccess} />
        <DeleteButton targets={data} onSuccess={onSuccess} />
        {
            flowAll || flowLikeAll ?
            <DownloadFlowButton targets={data as (FlowType|FolderType)[]} />:
            <></>
        }
        {
            fileAll ?
            <DownloadFileButton targets={data as (FrameType|DocumentType)[]} />:
            <></>
        }
        {
            flowAll ?
                // FIXME: onChangeハンドラが呼ばれると、親コンポーネントであるLibraryが
                // このMultiDataDrawerを破棄するので、EditLockSwitchが保持するstateの初期値も破棄される
                // そのため一度EditLockSwitchを変更すると初期値(トグル中央の状態)に戻せない
                <Box>
                <EditLockSwitch key='editLock'
                                targets={data as FlowType[]}
                                // 編集ロックの値はこのコンポーネント内では保持しない
                                state={[
                                    {
                                        value: (data as FlowType[]).map(datum => datum.editLock),
                                        isError: false
                                    },
                                    ()=>{}
                                ]}
                                onChange={updated=>onSuccess(updated)} />
                </Box> :
            <></>
        }
    </Drawer2>;
};
