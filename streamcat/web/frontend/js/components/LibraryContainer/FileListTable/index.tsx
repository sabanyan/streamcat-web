import React from 'react';
import {useState} from 'react';
import * as style from './style.scss';
import {DatumEntryType} from 'Components/LibraryContainer/Libary/index';
import {
    ITableHeader,
    TTableHeaderSortType,
    FileListHeader
} from 'LibraryContainer/FileListTable/FileListHeader';
import {FileListBody} from 'LibraryContainer/FileListTable/FileListBody';

interface Props {
    bodies: DatumEntryType[];
    minWidth?: number | string;
    onClickHeader: (header: ITableHeader, event?: React.MouseEvent<HTMLSpanElement>) => void;
    onClickFileName: (body: DatumEntryType, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: DatumEntryType, event?: React.MouseEvent<HTMLTableRowElement>) => void;
}

const FileListTable = (props: Props) => {
    const {bodies, minWidth, onClickHeader, onClickFileName, onClickCell} = props;

    const initialHeaders = [
        {label: '名前', key: 'label'},
        {label: '作成者', key: 'creator', width: 200},
        {label: '作成日時', key: 'createdAt', width: 184}
    ];
    const [headers, setHeaders] = useState<ITableHeader[]>(initialHeaders);

    const [, updateState] = React.useState<{}>();
    const forceUpdate = React.useCallback(() => updateState({}), []);

    const _onClickHeader = (clickHeader: ITableHeader) => {
        let clickedHeader;
        const newHeaders = headers.map((header,index)=>{
            if(header === clickHeader){
                headers[index].sort = onChangeSort(headers[index].sort);
                clickedHeader = headers[index];
            }else{
                headers[index].sort = null;
            }
            return header;
        });
        setHeaders(newHeaders);
        if(clickedHeader)onClickHeader(clickedHeader);
        forceUpdate();
    };

    const onChangeSort = (sort: TTableHeaderSortType) => {
        switch (sort) {
            case 'asc':
                return 'desc';
            case 'desc':
                return null;
            default:
                return 'asc';
        }
    };

    return <table className={style.fileListTable} style={{minWidth:minWidth}}>
        <FileListHeader headers={headers}
                        onClick={_onClickHeader} />
        <FileListBody bodies={bodies}
                      onClickFileName={onClickFileName}
                      onClickCell={onClickCell} />
    </table>;
};

export {FileListTable};
