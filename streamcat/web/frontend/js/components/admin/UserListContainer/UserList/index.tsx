import React from 'react';
import {useEffect, useRef, useState} from 'react';
import {useAsyncResource, AsyncResourceContent} from 'use-async-resource';
import style from './style.scss';
import {Api} from 'Api';
import {Flex, Spacer} from 'Shared/Base';
import {NotificationManager} from 'Shared/Notification';
import Constants from 'Constants/index';
import {FilterListLinkButton} from 'Shared/Input/FilterListLinkButton';
import {FilterSelectedList} from "Shared/Input/FilterListLinkButton/FilterSelectedList";
import {IFilterCategoryItem, IFilterListItem} from 'Types/index'
import {NavigationType, UserType} from 'Model/Navigation/NavigationModel';
import { UserBody } from '../UserBody';

export type UserType2 = UserType & {
    selected: boolean;
};

interface Props {
    navigation: NavigationType | null;
}

export const UserList = (props: Props) => {

    console.log("UserList2");

    // 全てのプロジェクトを取得する
    const exceptMyProject = true;
    const [projectsReader, refreshProjects] = useAsyncResource(Api.findProjects, true, exceptMyProject);

    // 読み込み完了を設定する
    const [users, setUsers] = useState<UserType2[]>([]);
    const [lastSelectedCell, setLastSelectedCell] = useState<UserType2 | null>(null);
    const [selectedDatas, setSelectedDatas] = useState<UserType2[]>([]);
    const clickedUserListCell = useRef(false);
    const [keyword,setKeyword] = useState<string>("");
    const [selectableProjects,setSelectableProjects] = useState(projectsReader());

    const setInitialFilterList = () => {
        const projectData: IFilterListItem[] = selectableProjects.map((project) => {
            return {
                id: project.uuid,
                label: project.label,
                selected: false
            }
        });

        const statusData: IFilterListItem[] = [{
            id: Constants.admin.userStatus.tmp,
            label: '仮登録',
            selected: false
        }, {
            id: Constants.admin.userStatus.active,
            label: '利用中',
            selected: false
        }, {
            id: Constants.admin.userStatus.inactive,
            label: '削除済',
            selected: false
        }, {
            id: Constants.admin.userStatus.expired,
            label: '失効中',
            selected: false
        }];

        const list: IFilterCategoryItem[] = [
            {
                id: "project",
                label: '所属プロジェクト',
                multiple: false,
                data: projectData,
                disabled: !(projectData.length)
            },
            {
                id: "status",
                label: 'ステータス',
                multiple: true,
                data: statusData
            }
        ]
        setFilterList(list);
    }

    useEffect(() => {
        setInitialFilterList()
    }, [selectableProjects])

    const [filterList, setFilterList] = useState<IFilterCategoryItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState<IFilterCategoryItem | null>(null)

    const getSelectedFilter = ()=>{
        let selectedProjectUUIDs: string[] = []
        let selectedStatusTypes: string[] = []
        filterList.forEach((categoryListItem: IFilterCategoryItem)=>{
            if(categoryListItem.id === "project"){
                categoryListItem.data.forEach((listItem: IFilterListItem)=>{
                    if(listItem.selected){
                        selectedProjectUUIDs.push(listItem.id);
                    }
                })
            }else if(categoryListItem.id === "status"){
                categoryListItem.data.forEach((listItem: IFilterListItem)=>{
                    if(listItem.selected){
                        selectedStatusTypes.push(listItem.id);
                    }
                })
            }
        })
        return {
            selectedProjectUUIDs: selectedProjectUUIDs,
            selectedStatusTypes: selectedStatusTypes,
            hasNoFilter: (!selectedProjectUUIDs.length && !selectedStatusTypes.length)
        }
    }

    // 描画する
    const renderAll = () => {

        const onClickBody = () => {
            // UserBodyをクリックしたら押下フラグをtrueにする
            clickedUserListCell.current = true;
        }

        const onClickUserList = () => {
            // 押下フラグがfalseの場合にユーザの選択を解除する
            if (!clickedUserListCell.current) {
                console.log("UserList2: onMouseDownUserList", clickedUserListCell.current);
                // 選択状態を一旦解除
                setSelectedDatas([]);
                setLastSelectedCell(null);
            }
            // UserBodyを含む画面全域をクリックしたら押下フラグをfalseにする
            clickedUserListCell.current = false;
        };

        const onChangeKeyword = (e: React.ChangeEvent<HTMLInputElement>) => {
            setKeyword(e.target.value)
        }

        const removeSelectedCategory = (selectedCategory: IFilterCategoryItem)=>{
            return filterList.map(category =>{
                if(category.id === selectedCategory.id){
                    category.data = category.data.map((listItem)=>{
                        if(listItem.selected){
                            return {...listItem,selected:false}
                        }
                        return listItem
                    })
                    return category
                }
                return category
            });
        }

        const onClickRemove = (selectedCategory: IFilterCategoryItem)=>{
            // クリックされたカテゴリを非選択状態にする
            setFilterList(removeSelectedCategory(selectedCategory))
        }
        const onClickCategoryItem = (selectedCategoryItem: IFilterCategoryItem)=>{
            setSelectedCategory(selectedCategoryItem)
        }
        const onClickListItem = (selectedListItems: IFilterListItem[])=>{
            // 選択状態にする
            const newList = filterList.map(category =>{
                if(category.id === selectedCategory.id){
                    category.data = category.data.map((listItem)=>{
                        let hasFound = false
                        selectedListItems.forEach(selectedListItem => {
                            if(listItem.id === selectedListItem.id){
                                hasFound = true
                            }
                        })
                        return {...listItem,selected:hasFound}
                    })
                    return category
                }
                return category
            });
            setFilterList(newList)
        }

        return <>
            {/* {renderLoadingIcon()} */}
            <Flex justifyContent={'center'} fluid={true}>
                <Flex flexDirection={'row'} width={1480 + 40 + 40} minHeight={'calc(100vh - 64px)'} fluid={true}
                      onClick={onClickUserList}>
                    <Spacer width={40}/>
                    <Flex flexDirection={'column'}>
                        <Spacer height={40}/>
                        <Flex flexDirection={'row'}>
                            <div className={style.pageTitleHeader}>
                                <div className={style.searchHeaderContainer}>
                                    <div className={style.pageTitle}>
                                        ユーザー管理
                                    </div>
                                    <div className={style.searchBarContainer}>
                                        <input type={'text'} placeholder={'ユーザー名、E-mail で絞り込む'} className={'form-control'} onChange={onChangeKeyword}/>
                                    </div>
                                </div>
                                <Spacer height={20}/>
                                <div className={style.resultAndFilterContainer}>
                                    <div className={style.resultCount}>
                                        表示されている件数 {users.length}件
                                    </div>
                                    <div className={style.filterLinkContainer}>
                                        <FilterListLinkButton
                                            list={filterList}
                                            onClickFilterCategoryItem={onClickCategoryItem}
                                            onClickFilterListItem={onClickListItem}
                                        >検索フィルタ</FilterListLinkButton>
                                        <Spacer width={20}/>
                                        <FilterSelectedList onClickRemove={onClickRemove} list={filterList}/>
                                    </div>
                                </div>
                            </div>
                            <Spacer width={420}/>
                        </Flex>
                        <Spacer height={30}/>
                        <Flex flexDirection={'row'} onClick={onClickBody}>
                            <AsyncResourceContent fallback={<p>Loading...</p>}>
                            <UserBody navigation={props.navigation}
                                    keyword={keyword}
                                    selectableProjects={selectableProjects}
                                    lastSelectedCell = {[lastSelectedCell, setLastSelectedCell]}
                                    selectedDatas = {[selectedDatas, setSelectedDatas]}
                                    {...getSelectedFilter()}/>
                            </AsyncResourceContent>
                        </Flex>
                        <Spacer height={80}/>
                    </Flex>
                    <Spacer width={40}/>
                </Flex>
            </Flex>
            <NotificationManager/>
        </>
    };

    return renderAll()
};
