import * as React from 'react';
import style from './style.scss';
import classnames from 'classnames';
import {IFilterCategoryItem, IFilterFilterItem} from 'Types/index'
import ImageUtil from "Utils/ImageUtil";

interface Props {
    onClickRemove: (selectedCategory: IFilterCategoryItem) => void;
    list: IFilterCategoryItem[];
}

const FilterSelectedList = (props: Props) => {
    const {onClickRemove, list} = props;

    if (!list || !list.length) {
        return null;
    }


    let listItemElements:React.ReactNode[] = [];
    list.forEach((categoryItem) => {
        let labelText = '';
        const selectedListItem: IFilterFilterItem[] = []
        categoryItem.data.forEach((filterItem: IFilterFilterItem) => {
            if (filterItem.selected) {
                selectedListItem.push(filterItem)
            }
        })
        selectedListItem.forEach((item, index) => {
            const isNotFirst = (index > 0)
            const isLast = (selectedListItem.length === index)
            labelText = labelText + ((isNotFirst && !isLast) ? ', ' : '') + item.label
        })
        if (!selectedListItem.length) return
        if (labelText === "") return

        const listElement = <div className={style.listItem} onClick={()=>onClickRemove(categoryItem)}>
            {labelText}
            <div className={style.icon}>
                {ImageUtil.getIconElement("icon-remove-circle")}
            </div>
        </div>
        listItemElements.push(listElement);
    })

    return <>{listItemElements}</>;
};

export {FilterSelectedList};
