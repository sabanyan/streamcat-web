import React from 'react';
import style from './style.scss';
import {IFilterCategoryItem, IFilterListItem} from 'Shared/Input/FilterListLinkButton';
import ImageUtil from "Utils/ImageUtil";

interface Props {
    list: IFilterCategoryItem[];
    onClickRemove: (selectedCategory: IFilterCategoryItem) => void;
}

const FilterSelectedList = (props: Props) => {
    const {list, onClickRemove} = props;

    if (!list || !list.length) {
        return null;
    }

    let listItemElements:React.ReactNode[] = [];
    list.forEach((categoryItem,index) => {
        let labelText = '';
        const selectedListItem: IFilterListItem[] = []
        categoryItem.data.forEach((filterItem: IFilterListItem) => {
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

        const listElement = <div key={index} className={style.listItem} onClick={()=>onClickRemove(categoryItem)}>
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
