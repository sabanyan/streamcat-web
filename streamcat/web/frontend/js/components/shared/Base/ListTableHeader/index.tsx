import React from 'react';
import style from './style.scss';
import iconStyle from 'Shared/Input/FlatButton/style.scss';

export interface ITableHeader {
    label: string;
    key: string;
    width?: number;
    sort?: TTableHeaderSortType;
}

export interface SortedHeader {
    key: string;
    sortType: TTableHeaderSortType;
};

export type TTableHeaderSortType = 'asc' | 'desc' | null | undefined

interface Props {
    headers: ITableHeader[];
    sortedHeaders: [SortedHeader[], (value:React.SetStateAction<SortedHeader[]>)=>void];
}

export const ListTableHeader = (props: Props) => {
    const {headers} = props;

    const [sortedHeaders, setSortedHeaders] = props.sortedHeaders;

    const getIconFromSort = (sort?: TTableHeaderSortType): string | null => {
        switch (sort) {
            case  'asc':
                return 'icon-arrow-up';
            case 'desc':
                return 'icon-arrow-down';
            default:
                return null;
        }
    };

    const getIconElement = (icon: string | null) => {
        const baseUrl = '/front_static/';
        const iconElement = (icon)
            ? <img className={iconStyle.icon} src={baseUrl + 'images/icon/' + icon + '.svg'} />
            : null;
        return iconElement;
    };

    const shiftSortType = (sort: TTableHeaderSortType) => {
        switch (sort) {
            case 'asc':
                return 'desc';
            case 'desc':
                return null;
            default:
                return 'asc';
        }
    };

    const onClickHeader = (header:ITableHeader) => {
        // useStateの状態変数を更新するには新たな配列オブジェクトを設定する必要がある
        let nextSortedHeaders = [...sortedHeaders];
        const selectedHeader = nextSortedHeaders.find(sortedHeader => sortedHeader.key===header.key);

        if(selectedHeader){
            // 既にソート状態のヘッダが押下された場合はソート方向を変更する
            selectedHeader.sortType = shiftSortType(selectedHeader.sortType);
            // ヘッダの押下により未ソート状態になった場合はnextSortedHeadersから削除する
            nextSortedHeaders = nextSortedHeaders.filter(sortedHeader => !!sortedHeader.sortType);
        }else{
            // 未ソート状態のヘッダが新たに押下された場合はそのヘッダをソート状態に設定する
            nextSortedHeaders = [{
                key:header.key,
                sortType:shiftSortType(null)
            }];
        }
        // ヘッダーのソート状態の変更を反映する
        setSortedHeaders(nextSortedHeaders);
    };

    return <thead className={style.listTableHeader}
                  // ヘッダへのクリックイベントを親コンポーネントに伝搬させないことで
                  // ListTableBodyの選択状態を維持する
                  onClick={e => e.stopPropagation()}><tr>{
        headers.map((header,index) => {
            // ソートアイコンを取得する
            const sortIcon = getIconElement(
                getIconFromSort(
                    sortedHeaders.find(sortedHeader =>
                        sortedHeader.key===header.key
                    )?.sortType
                )
            );
            return <th key={index} style={{width: header.width}}>
                <span onClick={e => onClickHeader(header)} >
                    {header.label}{sortIcon}
                </span>
            </th>;
        })
    }</tr></thead>;
};
