import React from 'react';
import {useState} from "react";
import * as style from "./style.scss";
import {
    FileListHeader,
    ITableHeader,
    TTableHeaderSortType
} from "LibraryContainer/FileListTable/FileListHeader";
import {DatumEntryType} from 'Components/LibraryContainer/Libary/index';
import {FileListBody} from "LibraryContainer/FileListTable/FileListBody";

interface Props {
    onClickHeader: (header: ITableHeader, event?: React.MouseEvent<HTMLSpanElement>) => void;
    onClickFileName: (body: DatumEntryType, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: DatumEntryType, event?: React.MouseEvent<HTMLTableRowElement>) => void;
    bodies: DatumEntryType[];
    minWidth?: number | string;
}

const FileListTable = (props: Props) => {
    const {onClickHeader, onClickFileName, onClickCell, bodies, minWidth} = props;

    const initialHeaders = [
        {label: "名前", key: "label"},
        {label: "作成者", key: "creator", width: 200},
        {label: "作成日時", key: "createdAt", width: 184}
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
            case "asc":
                return "desc";
            case "desc":
                return null;
            default:
                return "asc";
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
