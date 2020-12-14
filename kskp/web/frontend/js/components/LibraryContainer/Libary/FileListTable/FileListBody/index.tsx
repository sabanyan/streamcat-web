import * as React from "react";
import { LinkButton } from "Shared/Input";
import moment from "moment";
import classnames from "classnames";
import style from "./style.scss";

export interface ITableBody {
    uuid: string;
    type: string;
    prevFolderPath: string;
    label: string;
    creator: string;
    createdAt: string;
    selected?: boolean;
    clickable?: boolean;
}

interface Props {
    onClickFileName: (body: ITableBody, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>) => void;
    bodies: ITableBody[];
}

const FileListBody = (props: Props) => {
    const { bodies, onClickCell, onClickFileName } = props;

    const getIconElement = (icon: string | null) => {
        const baseUrl = "/front_static/";
        const iconElement = (icon)
            ? <img className={style.icon} src={baseUrl + "images/icon/" + icon + ".svg"} />
            : null;
        return iconElement;
    };
    const getIconFromBodyType = (type: string): string | null => {
        switch (type) {
            case "project":
                return "icon-project";
            case "folder":
                return "icon-folder";
            case "trash":
                return "icon-trash";
            case "frame":
                return "icon-file-csv";
            case "flow":
                return "icon-flow";
            case "database":
                return "icon-database";
            case "remote-folder":
                return "icon-remote-folder";
            default:
                console.log(type);
                return null;
        }
    };
    const onClick = (event, body) => {
        onClickCell(body, event)
    };

    const bodiesElement = bodies.map((body: ITableBody, index) => {
        return <tr className={classnames(style.row, { [style.selected]: body.selected })}
            onClick={(event) => onClick(event, body)} key={index}>
            <td>
                {getIconElement(getIconFromBodyType(body.type))}
                {(body.clickable) ?
                    <LinkButton onClick={(event: React.SyntheticEvent<any, Event>) => {
                        onClickFileName(body, event);
                        event.stopPropagation();
                    }}>
                        {body.label}
                    </LinkButton>
                    :
                    <span className={style.filename}>{body.label}</span>
                }
            </td>
            <td>
                {body.creator}
            </td>
            <td className={style.date}>
                {moment(body.createdAt, 'YYYY-MM-DD hh:mm:ss', false).format('YYYY-MM-DD HH:mm')}
            </td>
        </tr>;
    });


    return <tbody>
        {bodiesElement}
    </tbody>;
};

export { FileListBody };
