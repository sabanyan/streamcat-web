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

    const getInitialCheckedArray = ():string[] => {
        // list から 初期値でチェックが入っている ID を抽出する
        let initialChecked: string[] = []
        list.forEach((categoryItem: IFilterCategoryItem) => {
            if(categoryItem.multiple){
                // 複数選択可能なカテゴリで、選択状態になっているもの
                categoryItem.data.forEach((listItem: IFilterListItem)=> {
                    if (listItem.selected) {
                        initialChecked.push(listItem.id)
                    }
                })
            }
        })
        return initialChecked
    }

    const [checkedArray, setCheckedArray] = useState<string[]>(getInitialCheckedArray())


    // カテゴリ（一階層目）のクリック処理
    const _onClickCategoryItem = (categoryItem: IFilterCategoryItem) => {
        setSelectedCategory(categoryItem)
        // 上位コンポーネントに通知
        onClickFilterCategoryItem(categoryItem)
    }

    // リスト（二階層目）が単一選択の場合の処理
    const _onClickListItem = (listItem: IFilterListItem) => {
        // 単一選択の場合
        setSelectedList(listItem)
        // 上位コンポーネントに通知
        onClickFilterListItem([listItem])
    }

    // リスト（二階層目）が複数選択可能な場合の処理
    // checkedArray にて一時的なチェック状態を保持する
    const _onCheckedListItem = (listItem: IFilterListItem, checked) => {
        if (checked) {
            // チェックをつける
            // リストにない場合は、リストに追加してチェックボックスにチェックをいれる
            if (!checkedArray.includes(listItem.id)) {
                setCheckedArray([...checkedArray, listItem.id])
            }
        }else{
            // チェックを外す
            setCheckedArray(checkedArray.filter(checkedId => {
                return !(listItem.id === checkedId)
            }))
        }
    }

    let listElement;
    if (!selectedCategory) {
        // カテゴリ（一階層目の表示）
        listElement = list.map((categoryItem,index) => {
            return <FilterCategoryItem key={index} disabled={categoryItem.disabled}
                onClick={() => _onClickCategoryItem(categoryItem)}>{categoryItem.label}</FilterCategoryItem>
        })
    } else {
        // リスト（二階層目の表示）
        listElement = selectedCategory.data.map((filterItem: IFilterListItem,index) => {
            return <FilterListItem
                key={index}
                onClick={() => _onClickListItem(filterItem)}
                onChecked={(checked) => _onCheckedListItem(filterItem, checked)}
                multiple={selectedCategory.multiple}
                selected={filterItem.selected}
                checked={checkedArray.includes(filterItem.id)}>
                {filterItem.label}</FilterListItem>
        })
    }

    let applyElement
    // 複数選択の場合
    if (selectedCategory && selectedCategory.multiple) {
        const onClickApply = () => {
            let checkedListItems = selectedCategory.data.filter((filterItem: IFilterListItem) => {
                const hasChecked = checkedArray.includes(filterItem.id);
                return hasChecked
            })
            // チェックされたリストを selected を true にする
            checkedListItems = checkedListItems.map(checkedListItem => {
                return {...checkedListItem,selected: true}
            })
            onClickFilterListItem(checkedListItems)
        }
        applyElement = <div className={style.apply}>
            <a href="#" className={style.applyLink} onClick={onClickApply}>適用</a>
        </div>
    }

    // 単一選択の場合
    return <div className={style.categoryItemList}>
        {listElement}
        {applyElement}
    </div>
};

export {FilterCategoryItemList};
