import * as React from "react";
import {useState} from "react";
import * as style from "./style.scss";
import {
    FileListHeader,
    ITableHeader,
    TTableHeaderSortType
} from "Components/LibraryContainer/Libary/FileListTable/FileListHeader";
import {FileListBody, ITableBody} from "Components/LibraryContainer/Libary/FileListTable/FileListBody";

interface Props {
    onClickHeader: (header: ITableHeader, event?: React.MouseEvent<HTMLTableHeaderCellElement>) => void;
    onClickFileName: (body: ITableBody, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>) => void;
    bodies: ITableBody[];
}

const FileListTable = (props: Props) => {
    const {onClickHeader, onClickFileName, onClickCell, bodies} = props;

    const initialHeaders = [
        {label: "名前", key: "label"},
        {label: "作成者", key: "creator", width: 200},
        {label: "作成日時", key: "createdAt", width: 184}
    ];
    const [headers, setHeaders] = useState<ITableHeader[]>(initialHeaders);

    const [, updateState] = React.useState();
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

    return <table className={style.fileListTable}>
        <FileListHeader headers={headers}
                        onClick={_onClickHeader} />
        <FileListBody bodies={bodies}
                      onClickFileName={onClickFileName}
                      onClickCell={onClickCell} />
    </table>;
};

export {FileListTable};
