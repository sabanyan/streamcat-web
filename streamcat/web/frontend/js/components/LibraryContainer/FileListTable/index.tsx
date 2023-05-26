import React from 'react';
import {useState} from 'react';
import dayjs from 'dayjs';
import * as style from './style.scss';
import * as lodash from 'lodash';
import Constants from 'Constants/index';
import {ActivityType, DatumType} from 'Model/Library';
import {ListTableBody} from 'Components/shared/Base/ListTableBody';
import { ListTableHeader, SortedHeader } from 'Components/shared/Base/ListTableHeader';
import { Link2 } from 'Components/shared/Input';
import WebUtil from 'Utils/WebUtil';
import StringUtil from 'Utils/StringUtil';
import HttpUtil from 'Utils/HttpUtil';

interface Props {
    mode: string;
    bodies: DatumType[];
    selectedDatas: [DatumType[], (value:React.SetStateAction<DatumType[]>)=>void];
    minWidth?: number | string;
}

const FileListTable = (props: Props) => {
    const {bodies, minWidth, mode, selectedDatas} = props;

    const initialHeaders = [
        {label: '名前', key: 'label'},
        {label: '作成者', key: 'creator', width: 200},
        {label: '作成日時', key: 'createdAt', width: 184}
    ];

    const [sortedHeaders, setSortedHeaders] = useState<SortedHeader[]>([]);

    // ファイルリストをソートする
    const sortBodies = (bodies: DatumType[], sortedHeaders: SortedHeader[]) => {
        // ヘッダが押下状態でない場合はソートしない
        if(sortedHeaders.length===0){
            return bodies;
        }
        return lodash.orderBy(bodies, sortedHeaders[0].key, sortedHeaders[0].sortType || undefined);
    };

    // ライブラリ画面の単体表示時のみ複数選択を許可
    const enableMultiSelect = (!inject_is_trash && mode === Constants.library.mode.list) ? true : false;

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
            return datum.type !== 'database';
        }
    }

    const onClickApply = (selected_data: DatumType) => {
        if (window.opener || !window.opener.closed) {
            window.opener.onCallbackApply(selected_data);
        }
        window.close();
    };

    const onClickFileName = (body: DatumType, event?: React.SyntheticEvent<any, Event>) => {
        if (event) event.stopPropagation();

        const isDialog = (HttpUtil.getURLParam('dialog') === 'true');
        const dialogOption = (isDialog) ? '?dialog=true' + ((mode) ? '&mode=' + mode : '') : '';

        if (body.type === 'trash') {
            WebUtil.navigateURL(WebUtil.webURL('/trashes' + dialogOption));
        }else if (body.type === 'folder') {
            WebUtil.navigateURL(WebUtil.webURL('/folders/' + body.uuid + dialogOption));
        }else if (body.type === 'project') {
            WebUtil.navigateURL(WebUtil.webURL('/projects/' + body.uuid + dialogOption));
        }else if (body.type === 'database') {
            // onClickEditDatabase(body as DatabaseType);
        }else if (body.type === 'frame') {
            if (mode === Constants.library.mode.frame_select) {
                // データソースの追加時
                onClickApply(body);
                return;
            }
            window.open(WebUtil.webURL('/preview?step_id=null&dialog=false&frame_uuid=' + body.uuid + '&title=' + StringUtil.urlEncode(body.label)));
        }else if (body.type === 'document') {
            window.open(WebUtil.webURL('/documents/' + body.uuid));
        }else if (body.type === 'flow') {
            if(mode===Constants.library.mode.flow_select){
                // フロー選択モードの場合
                onClickApply(body);
                return;
            }
            window.open(WebUtil.webURL('/flows/' + body.uuid + dialogOption));
        }else if (body.type==='activity') {
            window.open(WebUtil.webURL('/flows/' + (body as ActivityType).flowUuid + dialogOption));
        }
    };

    const fileListRow = (body:DatumType) => <>
        <td>
            {getIconElement(getIconFromBodyType(body.type))}
            {isClickable(body) ?
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
    </>;
    
    return <table className={style.fileListTable} style={{minWidth:minWidth}}>
        <ListTableHeader headers={initialHeaders}
                         sortedHeaders={[sortedHeaders, setSortedHeaders]} />
        <ListTableBody<DatumType>
            bodies={sortBodies(bodies, sortedHeaders)}
            selectedDatas={selectedDatas}
            enableMultiSelect={enableMultiSelect}
            listTableRow={fileListRow} />
    </table>;
};

export {FileListTable};
