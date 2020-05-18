import * as React from "react";
import {LinkButton} from "Shared/Input";
import style from "Shared/Input/FlatButton/style.scss";

export interface ITableBody {
    uuid: string;
    type: string;
    prevFolderPath: string;
    label: string;
    creator: string;
    createdAt: string;
}

interface Props {
    onClickFileName: (body: ITableBody) => void;
    onClickCell: (body: ITableBody) => void;
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
        return <tr onClick={() => onClickCell(body)} key={index}>
            <td>
            </td>
            <td>
                {getIconElement(getIconFromBodyType(body.type))}
                <LinkButton onClick={(e: React.SyntheticEvent<any, Event>) => {
                    onClickFileName(body);
                    e.stopPropagation();
                }}>
                    {body.label}
                </LinkButton>
                {body.uuid}
            </td>
            <td>
                {body.creator}
            </td>
            <td>
                {body.createdAt}
            </td>
        </tr>;
    });
    return <tbody>
    {bodiesElement}
    </tbody>;
};

export {FileListBody};
