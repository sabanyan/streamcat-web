import * as React from 'react';
import style from './style.scss';
import classnames from 'classnames';
import {useState} from 'react';
import {FilterCategoryItemList} from 'Shared/Input/FilterListLinkButton/FilterCategoryItemList';
import {FilterCategoryItem, FilterListItem} from 'Types/index'

interface Props {
    children: string;
    list?: FilterCategoryItem[];
}

const FilterListLinkButton = (props: Props) => {
    const {children} = props;
    const [hasShown, setHasShown] = useState(false);
    const onClick = () => {
        setHasShown(!hasShown);
    }
    const projectData: FilterListItem[] = [{
        id: 1,
        label: 'project',
        selected: false
    }];
    const statusData: FilterListItem[] = [{
        id: 1,
        label: '仮登録',
        selected: false
    }, {
        id: 1,
        label: '利用中',
        selected: false
    }, {
        id: 1,
        label: '削除済',
        selected: false
    }];
    const list: FilterCategoryItem[] = [
        {
            id: 1,
            label: '所属プロジェクト',
            multiple: false,
            data: projectData,
        },
        {
            id: 1,
            label: 'ステータス',
            multiple: true,
            data: statusData
        }
    ]
    const onClickFilterListItem = (item: FilterListItem) => {
        // 最終的に選択されたアイテム
    }

    const onClickFilterCategoryItem = (item: FilterCategoryItem) => {
        // 最終的に選択されたカテゴリー
    }

    return <div className={style.container}><a href="#" className={style.filterListLinkButton} onClick={onClick}>
        {children}
    </a>
        {(hasShown) ? <FilterCategoryItemList
            list={list}
            onClickFilterCategoryItem={onClickFilterCategoryItem}
            onClickFilterListItem={onClickFilterListItem}/> : null
        }
    </div>
};

export {FilterListLinkButton};
