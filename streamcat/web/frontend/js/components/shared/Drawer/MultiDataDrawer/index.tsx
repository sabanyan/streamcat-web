import React from 'react';
import { Drawer2 } from 'Shared/Input';
import { DatumType, FolderType, FlowType, FrameType, DocumentType } from 'Model/Library';
import { MoveButton } from 'Shared/Button/MoveButton';
import { DeleteButton } from 'Shared/Button/DeleteButton';
import { DownloadFlowButton } from 'Shared/Button/DownloadFlowButton';
import { DownloadFileButton } from 'Shared/Button/DownloadFileButton';

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
        {/* MUIのSliderでTrippleSwitchを実装する予定 */}
        {
            flowAll ?
            <p>全てフロー</p>:
            <></>
        }
    </Drawer2>;
};
