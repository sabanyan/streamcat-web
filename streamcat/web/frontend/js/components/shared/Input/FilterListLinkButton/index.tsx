import React from 'react';
import style from './style.scss';
import {useState} from 'react';
import {FilterCategoryItemList} from 'Shared/Input/FilterListLinkButton/FilterCategoryItemList';

export type IFilterCategoryItem = {
    id: string;
    label: string;
    multiple: boolean;
    data: IFilterListItem[];
    disabled?: boolean;
};

export type IFilterListItem = {
    id: string;
    label: string;
    selected: boolean;
};

interface Props {
    children?: string;
    list: IFilterCategoryItem[];
    onClickFilterCategoryItem: (item: IFilterCategoryItem)=>void;
    onClickFilterListItem: (categoryId: string, items: IFilterListItem[])=>void;
}

const FilterListLinkButton = (props: Props) => {
    const {children, list, onClickFilterCategoryItem, onClickFilterListItem} = props;
    const [hasShown, setHasShown] = useState(false);
    const onClick = (e) => {
        setHasShown(!hasShown);
        e.preventDefault();
    }

    const _onClickFilterCategoryItem = (item: IFilterCategoryItem) => {
        // 最終的に選択されたカテゴリー
        onClickFilterCategoryItem(item);
    }

    const _onClickFilterListItem = (categoryId: string, items: IFilterListItem[]) => {
        // 最終的に選択されたアイテム
        onClickFilterListItem(categoryId, items);
        setHasShown(false);
    }

    return <div className={style.container}><div className={style.filterListLinkButton} onClick={onClick}>
        {children}
    </div>
        {(hasShown) ? <FilterCategoryItemList
            list={list}
            onClickFilterCategoryItem={_onClickFilterCategoryItem}
            onClickFilterListItem={_onClickFilterListItem}/> : null
        }
    </div>
};

export {FilterListLinkButton};
