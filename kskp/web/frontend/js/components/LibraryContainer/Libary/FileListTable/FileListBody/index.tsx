import * as React from "react";
import {LinkButton} from "Shared/Input";

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

    const bodiesElement = bodies.map((body: ITableBody, index) => {
        return <tr onClick={() => onClickCell(body)} key={index}>
            <td>
                {body.type}
                <LinkButton onClick={(e: React.SyntheticEvent<any, Event>) => {
                    onClickFileName(body);
                    e.stopPropagation();
                }}>
                    {body.label}
                </LinkButton>
                {body.uuid}
                {body.creator}
                {body.createdAt}
            </td>
        </tr>;
    });
    return <tbody>
    {bodiesElement}
    </tbody>;
};

export {FileListBody};
