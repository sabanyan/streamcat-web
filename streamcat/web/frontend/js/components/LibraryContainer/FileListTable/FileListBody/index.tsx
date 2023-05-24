import React from 'react';
import dayjs from 'dayjs';
import { Link2 } from 'Shared/Input';
import classnames from 'classnames';
import style from './style.scss';
import {DatumEntryType} from 'Components/LibraryContainer/Libary/index';

interface Props {
    onClickFileName: (body: DatumEntryType, event?: React.SyntheticEvent<any, Event>) => void;
    onClickCell: (body: DatumEntryType, event?: React.MouseEvent<HTMLTableRowElement>) => void;
    bodies: DatumEntryType[];
}

const FileListBody = (props: Props) => {
    const { bodies, onClickCell, onClickFileName } = props;

    const getIconElement = (icon: string | null) => {
        const baseUrl = '/front_static/';
        const iconElement = (icon)
            ? <img className={style.icon} src={baseUrl + 'images/icon/' + icon + '.svg'} />
            : null;
        return iconElement;
    };
    const getIconFromBodyType = (type: string): string | null => {
        switch (type) {
            case 'project':
                return 'icon-project';
            case 'folder':
                return 'icon-folder';
            case 'trash':
                return 'icon-trash';
            case 'frame':
                return 'icon-file-csv';
            case 'flow':
                return 'icon-flow';
            case 'database':
                return 'icon-database';
            case 'rfolder':
                return 'icon-remote-folder';
            case 'document':
                return 'icon-file-csv';
            default:
                console.log(type);
                return null;
        }
    };
    const onClick = (event, body) => {
        onClickCell(body, event)
    };

    const bodiesElement = bodies.map((body, index) => {
        return <tr className={classnames(style.row,{[style.selected]: body.selected})}
                   onClick={(event)=>onClick(event,body)}
                   onMouseDown={(event)=>event.stopPropagation()}
                   key={index}>
            <td>
                {getIconElement(getIconFromBodyType(body.type))}
                {(body.clickable) ?
                    <Link2 value={body.label} onClick={e => onClickFileName(body, e)} />
                    :
                    <span className={style.filename}>{body.label}</span>
                }
            </td>
            <td>
                {body.creator}
            </td>
            <td className={style.date}>
                {dayjs(body.createdAt, 'YYYY-MM-DD hh:mm:ss', false).format('YYYY-MM-DD HH:mm')}
            </td>
        </tr>;
    });

    return <tbody>
        {bodiesElement}
    </tbody>;
};

export { FileListBody };
