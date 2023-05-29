import React from 'react';
import {useRef, useState} from 'react';
import {useAsyncResource, AsyncResourceContent} from 'use-async-resource';
import style from './style.scss';
import {Api} from 'Api';
import Constants from 'Constants/index';
import {Flex, Spacer} from 'Shared/Base';
import {NotificationManager} from 'Shared/Notification';
import {FilterListLinkButton, IFilterCategoryItem, IFilterListItem} from 'Shared/Input/FilterListLinkButton';
import {FilterSelectedList} from 'Shared/Input/FilterListLinkButton/FilterSelectedList';
import {NavigationType, UserType} from 'Model/Navigation/NavigationModel';
import { UserBody } from '../UserBody';

interface Props {
    navigation: NavigationType | null;
};

export const UserList = (props: Props) => {

    // 全てのプロジェクトを取得する
    const exceptMyProject = true;
    const [projectsReader] = useAsyncResource(Api.findProjects, true, exceptMyProject);

    // キーワード条件
    const [keyword, setKeyword] = useState('');
    // 所属プロジェクト条件
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    // ユーザ状態条件
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    // UserBodyコンポーネントで選択中のUser
    const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
    // UserBodyコンポーネントをクリックした時にtrueにする
    const clickedUserListCell = useRef(false);

    // 全てのプロジェクト
    const allProjects = projectsReader();

    const getSelectedSub = (filterItems: IFilterListItem[]) => {
        return filterItems.filter(listItem => listItem.selected).map(listItem => listItem.id);
    };

    const getSelected = (categoryItems: IFilterCategoryItem[])=>{
        let selectedProjects: string[] = []
        let selectedStatuses: string[] = []
        categoryItems.forEach((categoryListItem: IFilterCategoryItem)=>{
            if(categoryListItem.id === 'project'){
                selectedProjects = getSelectedSub(categoryListItem.data);
            }else if(categoryListItem.id === 'status'){
                selectedStatuses = getSelectedSub(categoryListItem.data);
            }
        })
        return {
            selectedProjects: selectedProjects,
            selectedStatuses: selectedStatuses,
        }
    };

    const makeCategoryItems = (selectedProjects: string[],
                                selectedStatuses: string[]): IFilterCategoryItem[] => {
        return [{
            id      : 'project',
            label   : '所属プロジェクト',
            multiple: false,
            data    : allProjects.map((project) => {
                return {
                    id      : project.uuid,
                    label   : project.label,
                    selected: selectedProjects.includes(project.uuid)
                }
            }),
            disabled: !(allProjects.length)
        }, {
            id      : 'status',
            label   : 'ステータス',
            multiple: true,
            data    : [{
                id: Constants.admin.userStatus.tmp,
                label: '仮登録',
                selected: selectedStatuses.includes(Constants.admin.userStatus.tmp)
            }, {
                id: Constants.admin.userStatus.active,
                label: '利用中',
                selected: selectedStatuses.includes(Constants.admin.userStatus.active)
            }, {
                id: Constants.admin.userStatus.inactive,
                label: '削除済',
                selected: selectedStatuses.includes(Constants.admin.userStatus.inactive)
            }, {
                id: Constants.admin.userStatus.expired,
                label: '失効中',
                selected: selectedStatuses.includes(Constants.admin.userStatus.expired)
            }]
        }];
    };

    // FilterListLinkButton、FilterSelectedListコンポーネントに設定する値を作成する
    const categoryItems = makeCategoryItems(selectedProjects, selectedStatuses);

    const onClickUserList = () => {
        // 押下フラグがfalseの場合にユーザの選択を解除する
        if (!clickedUserListCell.current) {
            // 選択状態を一旦解除
            setSelectedUsers([]);
        }
        // UserBodyを含む画面全域をクリックしたら押下フラグをfalseにする
        clickedUserListCell.current = false;
    };

    const onClickBody = () => {
        // UserBodyをクリックしたら押下フラグをtrueにする
        clickedUserListCell.current = true;
    };

    const onChangeKeyword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value)
    };

    const onClickListItem = (categoryId: string, selectedListItems: IFilterListItem[]) => {
        // Project : 新たに選択されたProjectだけが渡される
        // Status  : 既に選択済みのStatusも含めて渡される
        if(categoryId === 'project'){
            // Project選択時はselectedがfalseになるので、trueに変更する
            selectedListItems.forEach(selectedListItem => {
                selectedListItem.selected = true;
            });
            // 選択されたProjectを条件に設定する
            setSelectedProjects([...getSelectedSub(selectedListItems), ...selectedProjects]);
        }else if(categoryId === 'status'){
            // 選択されたStatusを条件に設定する
            setSelectedStatuses(getSelectedSub(selectedListItems));
        }
    };

    const onClickRemove = (selectedCategory: IFilterCategoryItem)=>{
        // 削除されたProjectまたはStatusを取得する
        const removed = getSelected([selectedCategory]);

        // 選択済みのProjectから削除されたProjectを除外する
        setSelectedProjects(
            selectedProjects.filter(selectedProjectUUID =>
                !removed.selectedProjects.includes(selectedProjectUUID))
        );

        // 選択済みのStatusから削除されたStatusを除外する
        setSelectedStatuses(
            selectedStatuses.filter(selectedStatusType =>
                !removed.selectedStatuses.includes(selectedStatusType))
        );
    };

    return <>
        <Flex justifyContent={'center'} fluid={true}>
            <Flex flexDirection={'row'}
                  width={1480 + 40 + 40}
                  minHeight={'calc(100vh - 64px)'}
                  fluid={true}
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
                                    {/* FIXME: users変数をUserBodyコンポーネントに移動したので件数を取得できなくなった */}
                                    表示されている件数 {0}件
                                </div>
                                <div className={style.filterLinkContainer}>
                                    <FilterListLinkButton
                                        list={categoryItems}
                                        onClickFilterCategoryItem={()=>{}}
                                        onClickFilterListItem={onClickListItem}
                                    >検索フィルタ</FilterListLinkButton>
                                    <Spacer width={20}/>
                                    <FilterSelectedList onClickRemove={onClickRemove} list={categoryItems}/>
                                </div>
                            </div>
                        </div>
                        <Spacer width={420}/>
                    </Flex>
                    <Spacer height={30}/>
                    <Flex flexDirection={'row'} onClick={onClickBody}>
                        <AsyncResourceContent fallback={<p>Loading...</p>}>
                        <UserBody navigation={props.navigation}
                                allProjects={allProjects}
                                keyword={keyword}
                                selectedProjects={selectedProjects}
                                selectedStatuses={selectedStatuses}
                                selectedUsers = {[selectedUsers, setSelectedUsers]}
                        />
                        </AsyncResourceContent>
                    </Flex>
                    <Spacer height={80}/>
                </Flex>
                <Spacer width={40}/>
            </Flex>
        </Flex>
        <NotificationManager/>
    </>;
};
