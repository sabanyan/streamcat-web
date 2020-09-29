import * as React from 'react';
import style from './style.scss';
import classnames from 'classnames';
import {IFilterCategoryItem, IFilterListItem} from 'Types/index'
import {useState} from 'react';
import {FilterCategoryItem} from 'Shared/Input/FilterListLinkButton/FilterCategoryItemList/FilterCategoryItem';
import {FilterListItem} from 'Shared/Input/FilterListLinkButton/FilterCategoryItemList/FilterListItem';

interface Props {
    list: IFilterCategoryItem[];
    onClickFilterListItem: (item: IFilterListItem) => void;
    onClickFilterCategoryItem: (item: IFilterCategoryItem) => void;
}

const FilterCategoryItemList = (props: Props) => {
    const {list, onClickFilterCategoryItem, onClickFilterListItem} = props;
    const [selectedCategory, setSelectedCategory] = useState<IFilterCategoryItem | null>(null);
    const [selectedList, setSelectedList] = useState<IFilterListItem | null>(null);

    // カテゴリ（一階層目）のクリック処理
    const _onClickCategoryItem = (categoryItem: IFilterCategoryItem) => {
        setSelectedCategory(categoryItem)
        // 上位コンポーネントに通知
        onClickFilterCategoryItem(categoryItem)
    }

    // リスト（二階層目）のクリック処理
    const _onClickListItem = (listItem: IFilterListItem) => {
        setSelectedList(listItem)
        // 上位コンポーネントに通知
        onClickFilterListItem(listItem)
    }

    let listElement;
    if (!selectedCategory) {
        // カテゴリ（一階層目の表示）
        listElement = list.map((categoryItem) => {
            return <FilterCategoryItem
                onClick={() => _onClickCategoryItem(categoryItem)}>{categoryItem.label}</FilterCategoryItem>
        })
    } else {
        // リスト（二階層目の表示）
        listElement = selectedCategory.data.map((filterItem: IFilterListItem) => {
            return <FilterListItem onClick={() => _onClickListItem(filterItem)} multi={selectedCategory.multi}>{filterItem.label}</FilterListItem>
        })
    }

    return <div className={style.categoryItemList}>
        {listElement}
    </div>
};

export {FilterCategoryItemList};
