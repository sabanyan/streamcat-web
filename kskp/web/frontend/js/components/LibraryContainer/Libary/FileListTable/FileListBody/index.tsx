import * as React from "react";
import {LinkButton} from "Shared/Input";
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
}

interface Props {
    onClickFileName: (body: ITableBody,event?:React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: ITableBody,event?:React.MouseEvent<HTMLTableRowElement>) => void;
    bodies: ITableBody[];
}

const FileListBody = (props: Props) => {
    const {bodies, onClickCell, onClickFileName} = props;

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

    const bodiesElement = bodies.map((body: ITableBody, index) => {
        return <tr className={classnames({[style.selected]: body.selected})} onClick={(event) => onClickCell(body,event)} key={index}>
            <td>
                {getIconElement(getIconFromBodyType(body.type))}
                <LinkButton onClick={(event: React.SyntheticEvent<any, Event>) => {
                    onClickFileName(body,event);
                    event.stopPropagation();
                }}>
                    {body.label}
                </LinkButton>
            </td>
            <td>
                {body.creator}
            </td>
            <td>
                {moment(body.createdAt).format("YYYY/MM/DD hh:mm")}
            </td>
        </tr>;
    });
    return <tbody>
    {bodiesElement}
    </tbody>;
};

export {FileListBody};
