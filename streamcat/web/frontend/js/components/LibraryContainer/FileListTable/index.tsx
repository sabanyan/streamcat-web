import React from 'react';
import {useState} from 'react';
import dayjs from 'dayjs';
import * as style from './style.scss';
import * as lodash from 'lodash';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Constants from 'Constants/index';
import StringUtil from 'Utils/StringUtil';
import HttpUtil from 'Utils/HttpUtil';
import WebUtil from 'Utils/WebUtil';
import {ActivityType, DatumType,} from 'Model/Library';
import { Link2 } from 'Shared/Input';
import { ListTableHeader, SortedHeader } from 'Shared/Base/ListTableHeader';
import {ListTableBodyDnD} from 'Shared/Base/ListTableBodyDnD';
import { SampleDragLayer } from 'Shared/Base/SampleDragLayer';

interface Props {
    mode: string;
    allDatas: DatumType[];
    selectedDatas: [DatumType[], (value:React.SetStateAction<DatumType[]>)=>void];
    minWidth?: number | string;
};

export const FileListTable = (props: Props) => {
    const {allDatas, minWidth, mode, selectedDatas} = props;

    const initialHeaders = [
        {label: '名前', key: 'label'},
        {label: '作成者', key: 'creator', width: 200},
        {label: '作成日時', key: 'createdAt', width: 184}
    ];

    const [sortedHeaders, setSortedHeaders] = useState<SortedHeader[]>([]);

    // ファイルリストをソートする
    const sortDatas = (datas: DatumType[], sortedHeaders: SortedHeader[]) => {
        // ヘッダが押下状態でない場合はソートしない
        if(sortedHeaders.length===0){
            return datas;
        }
        // lodash.orderBy()の前に、Array.slice()を用いて全てのDatumにWebAPIを発行する関数を付与する必要がある
        const cloneDatas = datas.slice();
        // NOTE: Lodash.sortByよりArray.prototype.sortの方が早いらしい
        return lodash.orderBy(cloneDatas, sortedHeaders[0].key, sortedHeaders[0].sortType || undefined);
    };

    // ライブラリ画面の単体表示時のみ複数選択を許可
    const enableMultiSelect = (!inject_is_trash && mode === Constants.library.mode.list) ? true : false;

    const getIconElement = (type: string) => {
        // DatumのTypeとアイコンファイル名の対応テーブル
        const iconTable = {
            project: 'icon-project',
            folder: 'icon-folder',
            trash:'icon-trash',
            flow: 'icon-flow',
            frame:'icon-file-csv',
            database:'icon-database',
            rfolder: 'icon-remote-folder',
            document:'icon-file-csv',
        };
        const icon = iconTable[type];
        const baseUrl = '/front_static/';
        return icon
            ? <img className={style.icon} src={baseUrl + 'images/icon/' + icon + '.svg'} />
            : null;
    };

    const isClickable = (datum:DatumType) => {
        // ゴミ箱の場合は全て選択不可
        if (inject_is_trash) {
            return false;
        }
        if (mode === Constants.library.mode.folder_select) {
            switch (datum.type) {
                case 'folder':
                case 'project':
                    return true;
                default:
                    return false;
            }
        } else if (mode === Constants.library.mode.frame_select) {
            switch (datum.type) {
                case 'frame':
                case 'folder':
                case 'project':
                case Constants.library.type.remoteFolder:
                case Constants.library.type.database:
                    return true;
                default:
                    return false;
            }
        }else if(mode===Constants.library.mode.flow_select){
            switch(datum.type){
                case 'flow':
                case 'folder':
                case 'project':
                    return true;
                default:
                    return false;
            };
        } else {
            // データベースとリモートフォルダはクリックさせない
            return datum.type !== 'database' && datum.type!=='rfolder';
        }
    };

    const onClickApply = (selected_data: DatumType) => {
        if (window.opener || !window.opener.closed) {
            window.opener.onCallbackApply(selected_data);
        }
        window.close();
    };

    const onClickFileName = (datum: DatumType, event?: React.SyntheticEvent<any, Event>) => {
        if (event) event.stopPropagation();

        const isDialog = (HttpUtil.getURLParam('dialog') === 'true');
        const dialogOption = (isDialog) ? '?dialog=true' + ((mode) ? '&mode=' + mode : '') : '';

        if (datum.type === 'trash') {
            WebUtil.navigateURL(WebUtil.webURL('/trashes' + dialogOption));
        }else if (datum.type === 'folder') {
            WebUtil.navigateURL(WebUtil.webURL('/folders/' + datum.uuid + dialogOption));
        }else if (datum.type === 'project') {
            WebUtil.navigateURL(WebUtil.webURL('/projects/' + datum.uuid + dialogOption));
        }else if (datum.type === 'frame') {
            if (mode === Constants.library.mode.frame_select) {
                // データソースの追加時
                onClickApply(datum);
                return;
            }
            window.open(WebUtil.webURL('/preview?step_id=null&dialog=false&frame_uuid=' + datum.uuid + '&title=' + StringUtil.urlEncode(datum.label)));
        }else if (datum.type === 'document') {
            window.open(WebUtil.webURL('/documents/' + datum.uuid));
        }else if (datum.type === 'flow') {
            if(mode===Constants.library.mode.flow_select){
                // フロー選択モードの場合
                onClickApply(datum);
                return;
            }
            window.open(WebUtil.webURL('/flows/' + datum.uuid + dialogOption));
        }else if (datum.type==='activity') {
            window.open(WebUtil.webURL('/flows/' + (datum as ActivityType).flowUuid + dialogOption));
        }
    };

    // テーブル行を作成する
    const createRowData = (datum:DatumType) => <>
        <td>
            {getIconElement(datum.type)}
            {isClickable(datum) ?
                <Link2 value={datum.label} onClick={e => onClickFileName(datum, e)} />
                :
                <span className={style.filename}>{datum.label}</span>
            }
        </td>
        <td>
            {datum.creator}
        </td>
        <td className={style.date}>
            {dayjs(datum.createdAt, 'YYYY-MM-DD hh:mm:ss', false).format('YYYY-MM-DD HH:mm')}
        </td>
    </>;

    return <DndProvider backend={HTML5Backend}>
        <table className={style.fileListTable} style={{minWidth:minWidth}}>
            <ListTableHeader headers={initialHeaders}
                             sortedHeaders={[sortedHeaders, setSortedHeaders]} />
            {/* ListTableBodyDnDで表示するallDatas配列の要素数が変更された時に
                ListTableBodyDnDのkey属性を変更して、各行に紐づくdropAndDragRefが保持する状態変数を破棄させる */}
            {/* NOTE: レンダリングを跨いで状態変数の数が異なる場合はReactからエラーが送出される
                https://react.dev/learn/preserving-and-resetting-state */}
            <ListTableBodyDnD<DatumType>
                key={allDatas.length}
                allDatas={sortDatas(allDatas, sortedHeaders)}
                selectedDatas={selectedDatas}
                createRowData={createRowData}
                canDrop={(draggingDatas,targetDatum) => ['project','folder'].includes(targetDatum.type)}
                enableMultiSelect={enableMultiSelect} />
        </table>
        {/* ドラッグ中のプレビュー */}
        <SampleDragLayer />
    </DndProvider>;
};
