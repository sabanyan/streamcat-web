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
    selectedUsers: [UserType[], (value:React.SetStateAction<UserType[]>)=>void];
    lastSelectedUser: [UserType|null, (value:React.SetStateAction<UserType|null>)=>void];
    minWidth?: number | string;
}

const UserListTable = (props: Props) => {
    const {bodies, minWidth} = props;

    const [selectedUsers, setSelectedUsers] = props.selectedUsers;
    const [lastSelectedUser, setLastSelectedUser] = props.lastSelectedUser;

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

    const onClickCell = (cell: UserType, event?: React.MouseEvent<HTMLTableRowElement>) => {
        const selectedUser = bodies.find(user=>(cell.uuid === user.uuid));

        if(!selectedUser){
            return;
        }

        if(event){
            event.stopPropagation();
        }

        if (event && (event.metaKey || event.ctrlKey)) {
            // command or ctrl + click
            if (selectedUsers.includes(selectedUser)) {
                setSelectedUsers(
                    selectedUsers.filter(d => d.uuid !== selectedUser.uuid)
                );
            } else {
                selectedUsers.push(selectedUser);
                setLastSelectedUser(selectedUser);
            }
        } else if (event && event.shiftKey) {
            // shift + click
            clearSelected();// 選択状態を一旦解除
            let current = bodies.findIndex(user=> selectedUser.uuid === user.uuid);
            if (lastSelectedUser) {
                let last = bodies.findIndex(user=> lastSelectedUser.uuid === user.uuid);
                let min, max;
                if (current >= last) {
                    min = last;
                    max = current;
                } else {
                    min = current;
                    max = last;
                }
                setSelectedUsers(
                    bodies.slice(min, max + 1)
                );
            }
        } else {
            // 単一選択
            clearSelected();
            setSelectedUsers([selectedUser]);
            setLastSelectedUser(selectedUser);
        }
    };

    const clearSelected = () => {
        setSelectedUsers([]);
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
                      onClickCell={onClickCell} />
    </table>;
};

export {UserListTable};
