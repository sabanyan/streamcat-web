import * as React from 'react';
import style from './style.scss';
import classnames from 'classnames';
import {IFilterCategoryItem, IFilterFilterItem} from 'Types/index'

interface Props {
    onClick: () => {};
    selectedCategory: IFilterCategoryItem;
}

const FilterSelectedListItem = (props: Props) => {
    const {onClick, selectedCategory} = props;
    const selectedListItem: IFilterFilterItem[] = []

    // 選択されているリスト（二階層目）のラベルを抽出
    selectedCategory.data.forEach((filterItem: IFilterFilterItem) => {
        if (filterItem.selected) {
            selectedListItem.push(filterItem.label)
        }
    })

    let labelText = '';
    selectedListItem.forEach((item, index) => {
        const isNotFirst = (index > 0)
        const isLast = (selectedListItem.length === index)
        labelText = labelText + item + (isNotFirst && !isLast) ? ',' : ''
    })

    return <div className={style.listItem}>
        {labelText}
        <div className={style.icon}>
            -
        </div>
    </div>
};

export {FilterSelectedListItem};
