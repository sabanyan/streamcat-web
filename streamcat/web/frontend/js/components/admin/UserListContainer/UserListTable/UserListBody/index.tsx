import React from 'react';
import classnames from 'classnames';
import style from './style.scss';
import {ProjectType} from 'Model/Library';
import { RoleType, UserType } from 'Model/Navigation/NavigationModel';
import {Badge} from 'Shared/Base/Badge';
import {Spacer} from 'Shared/Base';
import AdminUtil from 'Utils/AdminUtil';
import ImageUtil from 'Utils/ImageUtil';

interface Props {
    bodies: UserType[];
    selectedUsers: [UserType[], (value:React.SetStateAction<UserType[]>)=>void];
    lastSelectedUser: [UserType|null, (value:React.SetStateAction<UserType|null>)=>void];
}

const UserListBody = (props: Props) => {
    const {bodies} = props;

    const [selectedUsers, setSelectedUsers] = props.selectedUsers;
    const [lastSelectedUser, setLastSelectedUser] = props.lastSelectedUser;

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

    const onClick = (event, body) => {
        event.stopPropagation();
        onClickCell(body, event)
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

    const bodiesElement = bodies.map((body: UserType, index) => {
        const selected = selectedUsers.some(user => user.uuid === body.uuid);
        return <tr  key={index}
                    className={classnames(style.row, {[style.selected]: selected})}
                    onClick={(event) => onClick(event, body)}>
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
        </tr>;
    });

    return <tbody>
        {bodiesElement}
    </tbody>;
};

export {UserListBody};
