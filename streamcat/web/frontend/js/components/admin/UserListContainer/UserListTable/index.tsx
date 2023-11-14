import React, {useState} from 'react';
import * as style from './style.scss';
import * as lodash from 'lodash';
import { ProjectType } from 'Model/Library';
import { RoleType, UserType } from 'Model/Navigation/NavigationModel';
import { ListTableHeader, SortedHeader } from 'Shared/Base/ListTableHeader';
import { ListTableBody } from 'Shared/Base/ListTableBody';
import {Spacer} from 'Shared/Base';
import {Badge} from 'Shared/Base/Badge';
import AdminUtil from 'Utils/AdminUtil';
import ImageUtil from 'Utils/ImageUtil';

type Props = {
    allUsers: UserType[];
    selectedUsers: [UserType[], (value:React.SetStateAction<UserType[]>)=>void];
    minWidth?: number | string;
};

export const UserListTable = (props: Props) => {
    const {allUsers, minWidth, selectedUsers} = props;

    const initialHeaders = [
        {label: '名前', key: 'name'},
        {label: 'E-mail', key: 'email', width: 200},
        {label: '所属プロジェクト', key: 'projects', width: 220},
        {label: 'ステータス', key: 'state', width: 220},
        {label: '管理権限', key: 'admin_types', width: 220}
    ];
    const [sortedHeaders, setSortedHeaders] = useState<SortedHeader[]>([]);

    // ユーザリストをソートする
    // (lodash.orderByを用いた非破壊ソート)
    const sortUsers = (users: UserType[], sortedHeaders: SortedHeader[]) => {
        // ヘッダが押下状態でない場合はソートしない
        if(sortedHeaders.length===0){
            return users;
        }

        // lodash.orderBy()の前に、Array.slice()を用いて全てのDatumにWebAPIを発行する関数を付与する必要がある
        const cloneUsers = users.slice();

        if(sortedHeaders[0].key==='projects'){
            return lodash.orderBy(
                cloneUsers,
                // 所属するプロジェクト数でソートする
                (user: UserType) => user.projects?.length || 0,
                // 昇順/降順
                sortedHeaders[0].sortType || undefined
            );
        }else if(sortedHeaders[0].key==='admin_types'){
            return lodash.orderBy(
                cloneUsers,
                (user: UserType) => {
                    // システムとユーザ管理権限の有無を抽出する
                    const adminTypes = user.roles?.filter(
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
                sortedHeaders[0].sortType || undefined
            );
        } else{
            return lodash.orderBy(cloneUsers, sortedHeaders[0].key, sortedHeaders[0].sortType || undefined);
        }
    };

    const renderAdminTypes = (roles: RoleType[]) => {
        return roles.map((role, index): React.ReactNode => {
            const spacer = (index)?<React.Fragment key={index}><Spacer width={8}/></React.Fragment>:null
            switch (role.systemRole) {
                case 'USR_ADMIN':
                    return <React.Fragment key={index}>{spacer}<Badge color={'darkGreen'}>ユーザー</Badge></React.Fragment>;
                case 'SYS_ADMIN':
                    return <React.Fragment key={index}>{spacer}<Badge color={'darkBlue'}>システム</Badge></React.Fragment>;
                case 'EVERYONE':
                default:
                    return null;
            }
        })
    };

    const renderProjects = (projects: ProjectType[]) => {
        if (projects.length > 1) {
            return <div>{projects[0].label} 他{projects.length}</div>;
        } else if (projects.length == 1) {
            return <div>{projects[0].label}</div>;
        } else {
            return <></>;
        }
    };

    const createRowData = (user:UserType) => <>
        <td>
            {ImageUtil.getIconElement('icon-user')}
            {user.name}
        </td>
        <td>
            {user.email}
        </td>
        <td>
            {renderProjects(user.projects || [])}
        </td>
        <td>
            {AdminUtil.getUserStatus(user.state)}
        </td>
        <td style={{paddingLeft:'1rem'}}>
            {renderAdminTypes(user.roles || [])}
        </td>
    </>;

    return <table className={style.fileListTable} style={{minWidth:minWidth}}>
        <ListTableHeader headers={initialHeaders}
                         sortedHeaders={[sortedHeaders, setSortedHeaders]} />
        <ListTableBody<UserType>
            key={allUsers.length}
            allDatas={sortUsers(allUsers, sortedHeaders)}
            selectedDatas={selectedUsers}
            enableMultiSelect={true}
            createRowData={createRowData} />
    </table>;
};
