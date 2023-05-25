import React from 'react';
import dayjs from 'dayjs';
import classnames from 'classnames';
import style from './style.scss';
import { DatumType } from 'Model/Library';
import {DatumEntryType} from 'Components/LibraryContainer/Libary/index';
import { Link2 } from 'Shared/Input';

interface Props {
    bodies: DatumEntryType[];
    selectedDatas: [DatumType[], (value:React.SetStateAction<DatumType[]>)=>void];
    lastSelectedDatum: [DatumType|null, (value:React.SetStateAction<DatumType|null>)=>void];
    enableMultiSelect: boolean;
    onClickFileName: (body: DatumEntryType, event?: React.SyntheticEvent<any, Event>) => void;
}

const FileListBody = (props: Props) => {
    const { bodies, enableMultiSelect, onClickFileName } = props;

    const [selectedDatas, setSelectedDatas] = props.selectedDatas;
    const [lastSelectedDatum, setLastSelectedDatum] = props.lastSelectedDatum;

    const onClickCell = (cell: DatumEntryType, event?: React.MouseEvent<HTMLTableRowElement>): void => {
        const selectedDatum = cell;

        if(!selectedDatum){
            return;
        }

        if(event){
            event.stopPropagation();
        }

        if (event && (event.metaKey || event.ctrlKey) && enableMultiSelect) {
            // command or ctrl + click
            if (selectedDatas.includes(selectedDatum)) {
                setSelectedDatas(
                    selectedDatas.filter(d => d.uuid !== selectedDatum.uuid)
                );
            } else {
                selectedDatas.push(selectedDatum);
                setLastSelectedDatum(selectedDatum);
            }
        } else if (event && event.shiftKey && enableMultiSelect) {
            // shift + click
            clearSelected();// 選択状態を一旦解除
            // const children = parentFolder!.children;
            let current = bodies.findIndex(libraryChild => selectedDatum.uuid === libraryChild.uuid);
            if (lastSelectedDatum) {
                let last = bodies.findIndex(libraryChild => lastSelectedDatum.uuid === libraryChild.uuid);
                let min, max;
                if (current >= last) {
                    min = last;
                    max = current;
                } else {
                    min = current;
                    max = last;
                }
                setSelectedDatas(
                    bodies.slice(min, max + 1)
                );
            }
        } else {
            // 単一選択
            clearSelected();
            setSelectedDatas([selectedDatum]);
            setLastSelectedDatum(selectedDatum);
        }
    };

    const clearSelected = () => {
        setSelectedDatas([]);
    };
    
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
        const selected = selectedDatas.some(datum => datum.uuid === body.uuid);
        return <tr className={classnames(style.row,{[style.selected]: selected})}
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
