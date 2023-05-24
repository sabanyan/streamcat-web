import React from 'react';
import {useState} from 'react';
import * as style from './style.scss';
import * as lodash from 'lodash';
import Constants from 'Constants/index';
import {DatumType} from 'Model/Library';
import {DatumEntryType} from 'Components/LibraryContainer/Libary/index';
import {
    ITableHeader,
    TTableHeaderSortType,
    FileListHeader
} from 'LibraryContainer/FileListTable/FileListHeader';
import {FileListBody} from 'LibraryContainer/FileListTable/FileListBody';

interface Props {
    mode: string;
    bodies: DatumEntryType[];
    selectedDatas: [DatumType[], (value:React.SetStateAction<DatumType[]>)=>void];
    lastSelectedDatum: [DatumType|null, (value:React.SetStateAction<DatumType|null>)=>void];
    minWidth?: number | string;
    onClickFileName: (body: DatumEntryType, event?: React.SyntheticEvent<any, Event>) => void;
}

const FileListTable = (props: Props) => {
    const {bodies, minWidth, mode, onClickFileName} = props;

    const [selectedDatas, setSelectedDatas] = props.selectedDatas;
    const [lastSelectedDatum, setLastSelectedDatum] = props.lastSelectedDatum;

    const initialHeaders = [
        {label: '名前', key: 'label'},
        {label: '作成者', key: 'creator', width: 200},
        {label: '作成日時', key: 'createdAt', width: 184}
    ];
    const [headers, setHeaders] = useState<ITableHeader[]>(initialHeaders);

    const shiftSortOrder = (sort: TTableHeaderSortType) => {
        switch (sort) {
            case 'asc':
                return 'desc';
            case 'desc':
                return null;
            default:
                return 'asc';
        }
    };

    const onClickHeader = (clickHeader: ITableHeader) => {
        setHeaders(
            headers.map(header => ({
                label: header.label,
                key: header.key,
                width: header.width,
                sort: header===clickHeader? shiftSortOrder(header.sort): null
            }))
        );
    };

    const onClickCell = (cell: DatumEntryType, event?: React.MouseEvent<HTMLTableRowElement>): void => {
        const selectedDatum = cell;
        // ライブラリ画面の単体表示時のみ複数選択を許可
        const enableMultiSelect = (!inject_is_trash && mode === Constants.library.mode.list) ? true : false;

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

    // 押下状態のヘッダを取得する
    const clickedHeader = headers.find(header => header.sort);

    // ファイルリストをソートする
    const sortBodies = (bodies: DatumEntryType[], clickedHeader?: ITableHeader) => {
        // ヘッダが押下状態でない場合はソートしない
        if(!clickedHeader){
            return bodies;
        }

        return lodash.orderBy(bodies, clickedHeader.key, clickedHeader.sort || undefined);
    };

    return <table className={style.fileListTable} style={{minWidth:minWidth}}>
        <FileListHeader headers={headers}
                        onClick={onClickHeader} />
        <FileListBody bodies={sortBodies(bodies, clickedHeader)}
                      selectedDatas={selectedDatas}
                      onClickFileName={onClickFileName}
                      onClickCell={onClickCell} />
    </table>;
};

export {FileListTable};
