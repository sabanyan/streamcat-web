import React from 'react';
import {useState} from 'react';
import * as style from './style.scss';
import * as lodash from 'lodash';
import { ListTableHeader, SortedHeader } from 'Components/shared/Base/ListTableHeader';
import { ListTableBody } from 'Components/shared/Base/ListTableBody';
import { RoleType, UserType } from 'Model/Navigation/NavigationModel';
import {Badge} from 'Shared/Base/Badge';
import {Spacer} from 'Shared/Base';
import AdminUtil from 'Utils/AdminUtil';
import ImageUtil from 'Utils/ImageUtil';
import { ProjectType } from 'Model/Library';

interface Props {
    bodies: UserType[];
    selectedUsers: [UserType[], (value:React.SetStateAction<UserType[]>)=>void];
    lastSelectedUser: [UserType|null, (value:React.SetStateAction<UserType|null>)=>void];
    minWidth?: number | string;
}

const UserListTable = (props: Props) => {
    const {bodies, minWidth, selectedUsers, lastSelectedUser} = props;

    const initialHeaders = [
        {label: '名前', key: 'name'},
        {label: 'E-mail', key: 'email', width: 200},
        {label: '所属プロジェクト', key: 'projects', width: 220},
        {label: 'ステータス', key: 'state', width: 220},
        {label: 'StreamCat 管理権限', key: 'admin_types', width: 220}
    ];
    const [sortedHeaders, setSortedHeaders] = useState<SortedHeader[]>([]);

    // ユーザリストをソートする
    const sortBodies = (bodies: UserType[], sortedHeaders: SortedHeader[]) => {
        // ヘッダが押下状態でない場合はソートしない
        if(sortedHeaders.length===0){
            return bodies;
        }

        if(sortedHeaders[0].key==='projects'){
            return lodash.orderBy(
                bodies,
                // 所属するプロジェクト数でソートする
                (body: UserType) => body.projects?.length || 0,
                // 昇順/降順
                sortedHeaders[0].sortType || undefined
            );
        }else if(sortedHeaders[0].key==='admin_types'){
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
                sortedHeaders[0].sortType || undefined
            );
        } else{
            return lodash.orderBy(bodies, sortedHeaders[0].key, sortedHeaders[0].sortType || undefined);
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

    const fileListRow = (body:UserType) => <>
        <td>
            {ImageUtil.getIconElement('icon-user')}
            {body.name}
        </td>
        <td>
            {body.email}
        </td>
        <td>
            {renderProjects(body.projects || [])}
        </td>
        <td>
            {AdminUtil.getUserStatus(body.state)}
        </td>
        <td>
            {renderAdminTypes(body.roles || [])}
        </td>
    </>;

    return <table className={style.fileListTable} style={{minWidth:minWidth}}>
        <ListTableHeader headers={initialHeaders}
                         sortedHeaders={[sortedHeaders, setSortedHeaders]} />
        <ListTableBody<UserType>
            bodies={sortBodies(bodies, sortedHeaders)}
            selectedDatas={selectedUsers}
            lastSelectedDatum={lastSelectedUser}
            enableMultiSelect={true}
            listTableRow={fileListRow} />
    </table>;
};

export {UserListTable};
