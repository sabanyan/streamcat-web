import * as React from "react";
import * as style from "./style.scss";
import {FileListHeader, ITableHeader} from "Components/LibraryContainer/Libary/FileListTable/FileListHeader";
import {FileListBody, ITableBody} from "Components/LibraryContainer/Libary/FileListTable/FileListBody";

interface Props {
    onClickHeader: (header: ITableHeader) => void;
    onClickFileName: (body: ITableBody) => void;
    onClickCell: (body: ITableBody) => void;
    bodies: ITableBody[];
}

const FileListTable = (props: Props) => {
    const {onClickHeader, onClickFileName, onClickCell, bodies} = props;

    const headers: ITableHeader[] = [
        {name: "", key: ""},
        {name: "名前", key: "name"},
        {name: "作成者", key: "creator"},
        {name: "作成日時", key: "create_date_time"}
    ];
    return <table className={style.fileListTable}>
        <FileListHeader headers={headers}
                        onClick={onClickHeader} />
        <FileListBody bodies={bodies}
                      onClickFileName={onClickFileName}
                      onClickCell={onClickCell} />
    </table>;
};

export {FileListTable};
