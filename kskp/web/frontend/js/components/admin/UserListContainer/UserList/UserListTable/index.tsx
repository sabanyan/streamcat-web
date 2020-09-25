import * as React from "react";
import {useState} from "react";
import * as style from "./style.scss";
import {
    ITableHeader,
    TTableHeaderSortType,
    UserListHeader
} from 'UserListContainer/UserList/UserListTable/UserListHeader';
import {ITableBody, UserListBody} from 'UserListContainer/UserList/UserListTable/UserListBody';


interface Props {
    onClickHeader: (header: ITableHeader, event?: React.MouseEvent<HTMLSpanElement>) => void;
    onClickFileName: (body: ITableBody, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>) => void;
    bodies: ITableBody[];
    minWidth?: number | string;
}

const UserListTable = (props: Props) => {
    const {onClickHeader, onClickFileName, onClickCell, bodies, minWidth} = props;

    const initialHeaders = [
        {label: "名前", key: "name"},
        {label: "E-mail", key: "email", width: 200},
        {label: "所属プロジェクト", key: "projects", width: 220},
        {label: "ステータス", key: "status", width: 220},
        {label: "KSKP 管理者", key: "admin_types", width: 220}
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

    return <table className={style.fileListTable} style={{minWidth:minWidth}}>
        <UserListHeader headers={headers}
                        onClick={_onClickHeader} />
        <UserListBody bodies={bodies}
                      onClickFileName={onClickFileName}
                      onClickCell={onClickCell} />
    </table>;
};

export {UserListTable};
