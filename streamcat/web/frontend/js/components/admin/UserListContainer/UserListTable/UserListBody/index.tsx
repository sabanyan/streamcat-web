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
    selectedUsers: UserType[];
    onClickFileName: (body: UserType, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: UserType, event?: React.MouseEvent<HTMLTableRowElement>) => void;
}

const UserListBody = (props: Props) => {
    const {bodies, selectedUsers, onClickCell, onClickFileName} = props;

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
