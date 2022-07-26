import React from 'react';
import {useState} from 'react';
import * as style from './style.scss';
import * as lodash from 'lodash';
import { UserType } from 'Model/Navigation/NavigationModel';
import {
    ITableHeader,
    TTableHeaderSortType,
    UserListHeader
} from 'UserListContainer/UserListTable/UserListHeader';
import {UserListBody} from 'UserListContainer/UserListTable/UserListBody';


interface Props {
    bodies: UserType[];
    selectedUsers: UserType[];
    onClickFileName: (body: UserType, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: UserType, event?: React.MouseEvent<HTMLTableRowElement>) => void;
    minWidth?: number | string;
}

const UserListTable = (props: Props) => {
    const {onClickFileName, onClickCell, bodies, selectedUsers, minWidth} = props;

    const initialHeaders = [
        {label: '名前', key: 'name'},
        {label: 'E-mail', key: 'email', width: 200},
        {label: '所属プロジェクト', key: 'projects', width: 220},
        {label: 'ステータス', key: 'state', width: 220},
        {label: 'StreamCat 管理権限', key: 'admin_types', width: 220}
    ];
    const [headers, setHeaders] = useState<ITableHeader[]>(initialHeaders);

    const shiftSortOrder = (sort: TTableHeaderSortType) => {
        switch (sort) {
            case 'asc':
                return 'desc';
            case 'desc':
                return null;
            default:
                return 'asc';
        }
    };

    const onClickHeader = (clickHeader: ITableHeader) => {
        setHeaders(
            headers.map(header => ({

                    label: header.label,
                    key: header.key,
                    width: header.width,
                    sort: header===clickHeader? shiftSortOrder(header.sort): null
            }))
        );
    };

    // 押下状態のヘッダを取得する
    const clickedHeader = headers.find(header => header.sort);

    // ユーザリストをソートする
    const sortBodies = (bodies: UserType[], clickedHeader?: ITableHeader) => {
        // ヘッダが押下状態でない場合はソートしない
        if(!clickedHeader){
            return bodies;
        }

        if(clickedHeader.key==='projects'){
            return lodash.orderBy(
                bodies,
                // 所属するプロジェクト数でソートする
                (body: UserType) => body.projects?.length || 0,
                // 昇順/降順
                clickedHeader.sort || undefined
            );
        }else if(clickedHeader.key==='admin_types'){
            return lodash.orderBy(
                bodies,
                (body: UserType) => {
                    // システムとユーザ管理権限の有無を抽出する
                    const adminTypes = body.roles?.filter(
                        role => role.systemRole==='SYS_ADMIN' || role.systemRole==='USR_ADMIN'
                    ) || [];
                    // 抽出した管理権限からソート順序を決定する
                    if(adminTypes.length===2){
                        return 3;
                    }else if(adminTypes.length===1 && adminTypes[0].systemRole==='SYS_ADMIN'){
                        return 2;
                    }else if(adminTypes.length===1 && adminTypes[0].systemRole==='USR_ADMIN'){
                        return 1;
                    }else{
                        return 0;
                    }
                },
                // 昇順/降順
                clickedHeader.sort || undefined
            );
        } else{
            return lodash.orderBy(bodies, clickedHeader.key, clickedHeader.sort || undefined);
        }
    };

    return <table className={style.fileListTable} style={{minWidth:minWidth}}>
        <UserListHeader headers={headers}
                        onClick={onClickHeader} />
        <UserListBody bodies={sortBodies(bodies, clickedHeader)}
                      selectedUsers={selectedUsers}
                      onClickFileName={onClickFileName}
                      onClickCell={onClickCell} />
    </table>;
};

export {UserListTable};
