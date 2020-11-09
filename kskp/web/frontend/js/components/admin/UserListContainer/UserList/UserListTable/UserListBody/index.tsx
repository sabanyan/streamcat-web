import * as React from 'react';
import {LinkButton} from 'Shared/Input';
import moment from 'moment';
import classnames from 'classnames';
import style from './style.scss';
import {Badge} from 'Shared/Base/Badge';
import {Spacer} from 'Shared/Base';
import AdminUtil from 'Utils/AdminUtil';
import ImageUtil from "Utils/ImageUtil";

export interface ITableBody {
    uuid: string;
    name: string;
    email: string;
    status: string;
    admin_types: {
        uuid: string,
        systemRole: string,
    }[];
    projects: {
        uuid: string,
        label: string
    }[],
    creator: string;
    createdAt: string;
    selected?: boolean;
    clickable?: boolean;
    password?: string;
}

interface Props {
    onClickFileName: (body: ITableBody, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>) => void;
    bodies: ITableBody[];
}

const UserListBody = (props: Props) => {
    const {bodies, onClickCell, onClickFileName} = props;

    const onClick = (event, body) => {
        onClickCell(body, event)
    };


    const renderAdminTypes = (admin_types: {
        uuid: string,
        systemRole: string,
    }[]): React.ReactNode => {
        return admin_types.map((type: {
            uuid: string,
            systemRole: string,
        },index): React.ReactNode => {
            const spacer = (index)?<React.Fragment key={index}><Spacer width={8}/></React.Fragment>:null
            switch (type.systemRole) {
                case 'USR_ADMIN':
                    return <React.Fragment key={index}>{spacer}<Badge color={"darkGreen"}>ユーザー</Badge></React.Fragment>;
                case 'SYS_ADMIN':
                    return <React.Fragment key={index}>{spacer}<Badge color={"darkBlue"}>システム</Badge></React.Fragment>;
                case 'EVERYONE':
                default:
                    return null
            }
        })
    };

    const renderProjects = (projects: {
        uuid: string,
        label: string
    }[]): React.ReactNode => {
        if (projects.length > 1) {
            return <div>{projects[0].label} 他{projects.length}</div>
        } else if (projects.length == 1) {
            return <div>{projects[0].label}</div>
        } else {
            return null
        }
    };

    const bodiesElement = bodies.map((body: ITableBody, index) => {
        return <tr key={body.uuid} className={classnames(style.row, {[style.selected]: body.selected})}
                   onClick={(event) => onClick(event, body)}>
            <td>
                {ImageUtil.getIconElement("icon-user")}
                {body.name}
            </td>
            <td>
                {body.email}
            </td>
            <td>
                {renderProjects(body.projects)}
            </td>
            <td>
                {AdminUtil.getUserStatus(body.status)}
            </td>
            <td>
                {renderAdminTypes(body.admin_types)}
            </td>
        </tr>;
    });
    return <tbody>
    {bodiesElement}
    </tbody>;
};

export {UserListBody};
