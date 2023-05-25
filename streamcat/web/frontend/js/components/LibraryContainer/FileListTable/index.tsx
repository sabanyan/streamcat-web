import React from 'react';
import {useState} from 'react';
import * as style from './style.scss';
import * as lodash from 'lodash';
import Constants from 'Constants/index';
import {DatumType} from 'Model/Library';
import {DatumEntryType} from 'Components/LibraryContainer/Libary/index';
import {FileListBody} from 'LibraryContainer/FileListTable/FileListBody';
import { ListTableHeader, SortedHeader } from 'Components/shared/Base/ListTableHeader';

interface Props {
    mode: string;
    bodies: DatumEntryType[];
    selectedDatas: [DatumType[], (value:React.SetStateAction<DatumType[]>)=>void];
    lastSelectedDatum: [DatumType|null, (value:React.SetStateAction<DatumType|null>)=>void];
    minWidth?: number | string;
    onClickFileName: (body: DatumEntryType, event?: React.SyntheticEvent<any, Event>) => void;
}

const FileListTable = (props: Props) => {
    const {bodies, minWidth, mode, selectedDatas, lastSelectedDatum, onClickFileName} = props;

    const initialHeaders = [
        {label: '名前', key: 'label'},
        {label: '作成者', key: 'creator', width: 200},
        {label: '作成日時', key: 'createdAt', width: 184}
    ];

    const [sortedHeaders, setSortedHeaders] = useState<SortedHeader[]>([]);

    // ファイルリストをソートする
    const sortBodies = (bodies: DatumEntryType[], sortedHeaders: SortedHeader[]) => {
        // ヘッダが押下状態でない場合はソートしない
        if(sortedHeaders.length===0){
            return bodies;
        }
        return lodash.orderBy(bodies, sortedHeaders[0].key, sortedHeaders[0].sortType || undefined);
    };

    // ライブラリ画面の単体表示時のみ複数選択を許可
    const enableMultiSelect = (!inject_is_trash && mode === Constants.library.mode.list) ? true : false;

    return <table className={style.fileListTable} style={{minWidth:minWidth}}>
        <ListTableHeader headers={initialHeaders}
                         sortedHeaders={[sortedHeaders, setSortedHeaders]} />
        <FileListBody bodies={sortBodies(bodies, sortedHeaders)}
                      selectedDatas={selectedDatas}
                      lastSelectedDatum={lastSelectedDatum}
                      enableMultiSelect={enableMultiSelect}
                      onClickFileName={onClickFileName} />
    </table>;
};

export {FileListTable};
