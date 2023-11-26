import React, {useRef, useState} from 'react';
import {useAsyncResource, AsyncResourceContent} from 'use-async-resource';
import style from './style.scss';
import Constants from 'Constants/index';
import {Api} from 'Api';
import {NavigationType, UserType} from 'Model/Navigation/NavigationModel';
import { NotAllowed } from 'Components/NotAllowedContainer';
import {Flex, Spacer} from 'Shared/Base';
import {NotificationManager} from 'Shared/Notification';
import { TextField2  } from 'Shared/Input';
import {FilterListLinkButton, IFilterCategoryItem, IFilterListItem} from 'Shared/Input/FilterListLinkButton';
import {FilterSelectedList} from 'Shared/Input/FilterListLinkButton/FilterSelectedList';
import { UserBody } from '../UserBody';

type Props = {
    navigation: NavigationType | null;
};

export const UserList = (props: Props) => {
    // 全てのプロジェクトを取得する
    const exceptMyProject = true;
    const [projectsReader] = useAsyncResource(Api.findProjects, true, exceptMyProject);

    // 自身のユーザ情報が変更された時は最新のNavigationを再取得するため状態変数として保持する
    const [navigation, setNavigation] = useState(props.navigation);
    // キーワード条件
    const [keyword, setKeyword] = useState({value:'', isError:true});
    // 所属プロジェクト条件
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    // ユーザ状態条件
    const initStatuses = [
        Constants.admin.userStatus.tmp,
        Constants.admin.userStatus.active,
        Constants.admin.userStatus.expired
    ];
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initStatuses);
    // UserBodyコンポーネントで選択中のUser
    const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
    // UserBodyコンポーネントをクリックした時にtrueにする
    const clickedUserListCell = useRef(false);

    // ユーザ一覧を参照する権限がない場合は表示しない
    if(! navigation?.allowlist.findUsers){
        return <NotAllowed />;
    };

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

    const onSuccess = (newUsers:UserType[]) => {
        // 自身のユーザ情報が変更された時はallowlistを再読み込みする
        if(-1 !== newUsers.findIndex(user => user.uuid===navigation.user.uuid)){
            Api.findNavigation().then(navi => setNavigation(navi));
        }
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
                            <div className={style.searchBarContainer}>
                                <TextField2 key='search'
                                            label='ユーザー名、E-mail で絞り込む'
                                            type='search'
                                            state={[keyword,setKeyword]} />
                            </div>
                            <Spacer height={20}/>
                            <div className={style.filterLinkContainer}>
                                <FilterListLinkButton
                                    list={categoryItems}
                                    onClickFilterCategoryItem={()=>{}}
                                    onClickFilterListItem={onClickListItem}
                                >検索フィルタ</FilterListLinkButton>
                                <Spacer width={20}/>
                                <FilterSelectedList list={categoryItems} onClickRemove={onClickRemove}/>
                            </div>
                        </div>
                        <Spacer width={420}/>
                    </Flex>
                    <Spacer height={30}/>
                    <span onClick={onClickBody}>
                        <AsyncResourceContent fallback={<p>Loading...</p>}>
                            <UserBody navigation={navigation}
                                    allProjects={allProjects}
                                    keyword={keyword.value}
                                    selectedProjects={selectedProjects}
                                    selectedStatuses={selectedStatuses}
                                    selectedUsers = {[selectedUsers, setSelectedUsers]}
                                    onSuccess={onSuccess}
                            />
                        </AsyncResourceContent>
                    </span>
                    <Spacer height={80}/>
                </Flex>
                <Spacer width={40}/>
            </Flex>
        </Flex>
        <NotificationManager/>
    </>;
};
