import * as React from 'react';
import style from './style.scss';
import classnames from 'classnames';
import {useState} from 'react';
import {FilterCategoryItemList} from 'Shared/Input/FilterListLinkButton/FilterCategoryItemList';
import {IFilterCategoryItem, IFilterListItem} from 'Types/index'

interface Props {
    children: string;
    list: IFilterCategoryItem[];
    onClickFilterListItem: (item: IFilterListItem)=>void;
    onClickFilterCategoryItem: (item: IFilterCategoryItem)=>void;
}

const FilterListLinkButton = (props: Props) => {
    const {children, list, onClickFilterListItem, onClickFilterCategoryItem} = props;
    const [hasShown, setHasShown] = useState(false);
    const onClick = (e) => {
        setHasShown(!hasShown);
        e.preventDefault();
    }

    const _onClickFilterListItem = (item: IFilterListItem) => {
        // 最終的に選択されたアイテム
        onClickFilterListItem(item);
        setHasShown(false);
    }

    const _onClickFilterCategoryItem = (item: IFilterCategoryItem) => {
        // 最終的に選択されたカテゴリー
        onClickFilterCategoryItem(item);
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
