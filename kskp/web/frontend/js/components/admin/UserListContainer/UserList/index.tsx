import * as React from 'react'
import style from './style.scss';
import {useEffect, useRef, useState} from 'react';
import {APIUtil, ModalUtil, ReactDomUtil, ErrorUtil} from 'Utils/index';
import {UserListUser, UserProject, UserRole} from 'Types/index';
import {Flex, Loader, Spacer} from 'Shared/Base';
import {MenuList} from 'UserListContainer/UserList/MenuList';
import {UserListTable} from 'UserListContainer/UserList/UserListTable';
import {ITableBody} from 'UserListContainer/UserList/UserListTable/UserListBody';
import {ModalManager} from 'Shared/Modal';
import {NotificationManager} from 'Shared/Notification';
import {useDispatch} from 'react-redux';
import {addNotification, removeNotification} from 'reapop';
import {InputForm, TextField} from 'Shared/Input';
import Constants from 'Constants/index';
import Select from 'react-select';
import UserListInspector from 'Shared/Inspector/UserListInspector';
import {project} from 'Shared/IconRenderer/icon';
import {FilterListLinkButton} from 'Shared/Input/FilterListLinkButton';
import {FilterSelectedList} from "Shared/Input/FilterListLinkButton/FilterSelectedList";
import {IFilterCategoryItem, IFilterListItem} from 'Types/index'
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;
import {ITableHeader} from 'LibraryContainer/Libary/FileListTable/FileListHeader';
import * as lodash from 'lodash';
import Queue from "promise-queue-plus";
import {Props as NavigationModelProps} from 'Model/Navigation/NavigationModel';
import LibraryMultiInspector from 'Shared/Inspector/LibraryMultiInspector';
import UserListMultiInspector from 'Shared/Inspector/UserListMultiInspector';

interface Props {
    navigation?: NavigationModelProps
}

const UserList = (props: Props) => {
    const dispatch = useDispatch();

    // 通知機能メソッドの取得
    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };

    // 読み込み完了を設定する
    const [isFinished, setIsFinished] = useState<Boolean>(false);
    const [isLoading, setIsLoading] = useState<Boolean>(true);
    const [users, setUsers] = useState<UserListUser[]>([]);
    const [lastSelectedCell, setLastSelectedCell] = useState<UserListUser | null>(null);
    const [selectedDatas, setSelectedDatas] = useState<UserListUser[]>([]);
    const clickedUserListCell = useRef(false);
    const [keyword,setKeyword] = useState<string>("");
    const [projects,setProjects] = useState<UserProject[]>([]);
    const [selectableProjects,setSelectableProjects] = useState<UserProject[]>([]);

    const fetchProjects = (exceptMyProject:boolean = false) => {
        const except_my_project = (exceptMyProject)?"on":"off"
        const url = 'projects?except_myproject=' + except_my_project
        return APIUtil.get(url).then((response) => {
            const projects: UserProject[] = response.data.data;
            if(!exceptMyProject){
                setProjects(projects);
            }else{
                setSelectableProjects(projects)
            }
            setIsLoading(false);
            setIsFinished(true);
        }).catch((error) => {
            notify({
                title: 'プロジェクト取得エラー',
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                status: 'error',
                dismissAfter: 0,
                closeButton: true
            })
            setIsLoading(false);
            setIsFinished(true);
        });
    }
    // ユーザ一覧を取得する
    const fetchUsers = (keyword?: string) => {
        // APIをたたく
        const params = {
            projects: 'on',
            roles: 'on',
            query: keyword
        };
        setIsLoading(true);
        const url = 'users?' + ((keyword)?'q='+ params.query + '&': '') + 'projects=' + params.projects + '&roles=' + params.roles
        return APIUtil.get(url).then((response) => {
            const users: UserListUser[] = response.data.data;
            //setUsers(users);
            filterUsers(users);
            setIsLoading(false);
            setIsFinished(true);
        }).catch((error) => {
            console.log(error);
            notify({
                title: 'ユーザー一覧取得エラー',
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                status: 'error',
                dismissAfter: 0,
                closeButton: true
            })
            setIsLoading(false);
            setIsFinished(true);
        });
    };

    // ユーザを新規に作成する
    const createNewUser = async (name: string,email: string, projectUUIDs: string[] | null ) => {
        // APIをたたく
        const body = {
            email: email,
            name: name,
            password: null
        };
        setIsLoading(true);
        const url = 'users'
        // ユーザーの作成
        const newUserResponse = await APIUtil.post(url,body).catch(error=>{
            ErrorUtil.notifyError(notify,"ユーザー作成エラー",error)
            return Promise.reject()
        })
        if(!newUserResponse.data.success){
            ErrorUtil.notifyError(notify,"ユーザー作成エラー",newUserResponse.data.message)
            return Promise.reject()
        }
        if(projectUUIDs){
            // プロジェクトへの追加
            const json = newUserResponse.data.data;
            joinProject(json.uuid,projectUUIDs)
        }
        return Promise.resolve(newUserResponse)
    }

    // ユーザをプロジェクトに紐付ける
    const joinProject = (userUUID: string, projectUUIDs: string[]) => {
        projectUUIDs.forEach(projectUUID => {
            const url = 'projects/' + projectUUID + '/users/' + userUUID;
            const body = {
                'memberType': 'Reader'
            };
            (async() => {
                const response = await APIUtil.put(url, body).catch(error => {
                    ErrorUtil.notifyError(notify, 'プロジェクト追加エラー', error)
                    return Promise.reject()
                });
                if (!response.data.success) {
                    ErrorUtil.notifyError(notify, 'プロジェクト追加エラー', response.data.message)
                    return Promise.reject()
                }
                return Promise.resolve(response);
            })();
        });
    }

    // ユーザを削除する
    const deleteUser = (userListUser: UserListUser)=>{
        const url = 'users/' + userListUser.uuid;
        return APIUtil.delete(url).then((response)=>{
            setIsLoading(false);
        }).catch((error) => {
            notify({
                title: 'ユーザー削除エラー',
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                status: 'error',
                dismissAfter: 0,
                closeButton: true
            })
            setIsLoading(false);
        });
    }

    // ユーザのパスワードをリセットする
    const resetUserPassword = (uuid: string) =>{
        const url = 'users/' + uuid;
        const body = {
            password: null
        }
        return APIUtil.put(url,body).then((response)=>{
            fetchUsers();
            setIsLoading(false);
        }).catch((error) => {
            notify({
                title: 'パスワードリセットエラー',
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                status: 'error',
                dismissAfter: 0,
                closeButton: true
            })
            setIsLoading(false);
        });
    }

    useEffect(() => {
        fetchUsers();
        fetchProjects(false);
        fetchProjects(true);
    }, []);

    useEffect(()=>{
        // キーワードが変更されると同時に fetch する
        fetchUsers(keyword)
    },[keyword])

    useEffect(()=>{
        if(selectedDatas.length === 1){
            const selectedData = selectedDatas[0];
            // パスワードリセットの処理
            ModalUtil.registerModal({
                id: Constants.modal.RESET_USER_PASSWORD, onClickDone: () => {
                    resetUserPassword(selectedData.uuid).finally(() => {
                        ModalUtil.closeModal(Constants.modal.RESET_USER_PASSWORD);
                        clearSelected();
                    })
                },
            })
            // ユーザ作成後の確認ダイアログ
            ModalUtil.registerModal({
                id: Constants.modal.ADD_USER_CONFIRM, onClickDone: () => {
                    ModalUtil.closeModal(Constants.modal.ADD_USER_CONFIRM);
                }
            })
        }
    }, [selectedDatas])

    useEffect(()=>{
        // ユーザ削除の確認ダイアログ
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                let queue = Queue(
                    1, // concurrency
                    {
                        "retry": 0               //Number of retries
                        , "retryIsJump": false     //retry now?
                        , "timeout": 0            //The timeout period
                    }
                );
                setIsLoading(true);
                selectedDatas.forEach((selectedData: UserListUser) => {
                    queue.push(deleteUser, [selectedData]);
                });
                queue.push(setIsLoading, [false]);
                queue.push(fetchUsers, []);
                queue.start();
                ModalUtil.closeModal(Constants.modal.CONFIRM);
                clearSelected();
            },
        })
    },[selectedDatas])

    // ローディングアイコンを表示する
    const renderLoadingIcon = () => {
        return <Loader center={true} absolute={true} visible={isLoading}/>
    };

    // ユーザ一覧を表示する
    const renderUserList = () => {
        const onClickCell = (cell: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>) => {
            let data: UserListUser = users.find(user=>(cell.uuid === user.uuid));
            if (event) event.stopPropagation();
            if (event && (event.metaKey || event.ctrlKey)) {
                data.selected = true;
                // command or ctrl + click
                if (selectedDatas.includes(data)) {
                    data.selected = !data.selected;
                    setSelectedDatas(selectedDatas.filter(d => d.uuid !== data.uuid));
                    if(!data.selected){
                        setLastSelectedCell(null);
                    }
                } else {
                    selectedDatas.push(data);
                    setLastSelectedCell(data);
                }
            } else if (event && event.shiftKey) {
                // shift + click
                clearSelected();// 選択状態を一旦解除
                let current = users.findIndex(user=> data.uuid === user.uuid);
                if (lastSelectedCell) {
                    let last =  users.findIndex(user=> lastSelectedCell.uuid === user.uuid);
                    let min, max;
                    if (current >= last) {
                        min = last;
                        max = current;
                    } else {
                        min = current;
                        max = last;
                    }
                    const selectedDatas: UserListUser[] = users.slice(min, max + 1).map((user) => {
                        user.selected = true;
                        return user;
                    });
                    setSelectedDatas(selectedDatas);
                }
            } else {
                // 単一選択
                clearSelected();
                data.selected = true;
                setSelectedDatas([data]);
                setLastSelectedCell(data);
            }
            clickedUserListCell.current = true;
        };
        const onClickFileName = () => {

        };
        const onClickHeader= (header: ITableHeader) => {
            if (header.sort) {
                if(header.key === "projects"){
                    setUsers(lodash.orderBy(users, (e: UserListUser)=>{
                        const projects = e.projects.length
                        return projects
                    }, header.sort));
                }else if(header.key === "admin_types"){
                    setUsers(lodash.orderBy(users, (e: UserListUser)=>{
                        const roles = e.roles.filter(role => (role.systemRole != "EVERYONE"))
                        return JSON.stringify(roles)
                    }, header.sort));
                } else{
                    setUsers(lodash.orderBy(users, header.key, header.sort));
                }
            } else {
                fetchUsers()
            }
        }

        const bodies: ITableBody[] = users.map((user: UserListUser) => {
            let projects = [];
            if (user && Array.isArray(user.projects) && user.projects ) {
                projects = user.projects.map((project: UserProject) => {
                    return {
                        uuid: project.uuid,
                        label: project.label
                    }
                });
            }

            let admin_types = []
            if (user && user.roles && Array.isArray(user.roles)) {
                admin_types = user.roles.map((role: UserRole) => {
                    return {
                        systemRole: role.systemRole,
                        uuid: role.uuid
                    }
                })
            }

            let selected = false;
            selectedDatas.forEach((selectedUser:UserListUser)=>{
                if(user.uuid === selectedUser.uuid){
                    selected = true
                }
            })

            const body: ITableBody = {
                admin_types: admin_types,
                clickable: true,
                createdAt: user.createdAt,
                creator: user.creator,
                email: user.email,
                name: user.name,
                projects: projects,
                status: user.state,
                uuid: user.uuid,
                selected: selected,
                password: user.password
            };
            return body
        });


        return <UserListTable bodies={bodies} onClickCell={onClickCell} onClickFileName={onClickFileName}
                              onClickHeader={onClickHeader}/>
    };

    const [newUserName, setNewUserName] = useState<string | null>(null);
    const [newUserEmail, setNewUserEmail] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<UserProject | null>(null);


    useEffect(()=>{
        if (newUserName === null || newUserEmail === null) return;
        ModalUtil.registerModal({
            id: Constants.modal.ADD_USER, onClickDone: () => {
                if(!newUserName.length){
                    alert("名前を入力してください")
                    return
                }
                if(!newUserEmail.length){
                    alert("E-mailを入力してください")
                    return
                }
                const projectUUIDs = Array.isArray(selectedOption)?selectedOption.map(option=>option.value as string):null;
                createNewUser(newUserName,newUserEmail, projectUUIDs).then((response) => {
                    setIsLoading(false);
                    fetchUsers();
                    if(!response.data.success){
                        notify({
                            title: 'ユーザー作成エラー',
                            message: ReactDomUtil.renderToString(response.data.message),
                            status: 'error',
                            dismissAfter: 0,
                            closeButton: true
                        })
                        ModalUtil.closeModal(Constants.modal.ADD_USER)
                        clearField();
                        return
                    }
                    const data = response.data.data
                    ModalUtil.closeModal(Constants.modal.ADD_USER)
                    const project = (selectedOption && selectedOption.label)?<div>所属: {selectedOption.label}</div>: null;
                    ModalUtil.emitModal({
                        id: Constants.modal.ADD_USER_CONFIRM,
                        visible: true,
                        done: '閉じる',
                        content: <div className={style.modal}>
                            <form>
                                <div className={style.addUserLabel}>
                                    新規ユーザーの仮登録が完了しました。
                                </div>
                                <Spacer height={20}/>
                                <div className={style.addUserDetails}>
                                    <div>名前: {data.name}</div>
                                    <div>Email: {data.email}</div>
                                    {project}
                                    <div>仮パスワード: {data.password}</div>
                                </div>
                            </form>
                            <div className={'mt-8px'}/>
                        </div>
                    });
                    clearField();
                }).catch(() => {
                    ModalUtil.closeModal(Constants.modal.ADD_USER)
                    setIsLoading(false);
                })
            }, onClickCancel: ()=>{
                clearField();
            }
        })
    },[newUserEmail,newUserName, selectedOption])

    const clearField = () =>{
        setNewUserName("");
        setNewUserEmail("");
        setSelectedOption(null);
    }

    // メニューを表示
    const renderMenuList = () => {

        const onClickNewUser = () => {
            // モーダル表示
            const options = selectableProjects.map((project:UserProject)=>{
                return {
                    label: project.label,
                    value: project.uuid
                }
            })
            clearField();
            ModalUtil.emitModal({
                id: Constants.modal.ADD_USER,
                visible: true,
                done: '作成する',
                content: <div className={style.modal}>
                    <form>
                        <div className={style.label}>
                            名前
                        </div>
                        <div className={style.textField}>
                            <TextField onChange={(e) => setNewUserName(e.target.value)}/>
                        </div>
                        <Spacer height={9}/>
                        <div className={style.label}>
                            E-mail
                        </div>
                        <div className={style.textField}>
                            <TextField onChange={(e) => setNewUserEmail(e.target.value)}/>
                        </div>
                        <Spacer height={14}/>
                        <div className={style.label}>
                            所属プロジェクト
                        </div>
                        <div className={style.select}>
                            <Select
                                defaultValue={selectedOption}
                                onChange={setSelectedOption}
                                options={options}
                                placeholder={""}
                                isMulti={true}
                                isSearchable={false}
                                noOptionsMessage={_=>"選択できるプロジェクトがありません"}
                            />
                        </div>
                    </form>
                    <div className={'mt-8px'}/>
                </div>
            });
        };

        const {navigation} = props;
        if(navigation && navigation.allowlist && !navigation.allowlist.createUser){
            // ユーザ作成権限がない場合は、メニューを表示しない
            return null;
        }

        return <>
            <Spacer minWidth={40}/>
            <Flex flexDirection={'column'} fluid={true} width={280}>
                <Spacer height={160}/>
                <MenuList onClickNewUser={onClickNewUser}/>
            </Flex>
        </>
    };

    // ペインを表示
    const renderInspector = ():React.ReactNode => {
        if (!selectedDatas.length) return null;

        const onClickDelete = () => {
            let targets: string[] = [];
            selectedDatas.forEach((user) => {
                targets.push(user.name);
            });

            ModalUtil.emitModal({
                id: Constants.modal.CONFIRM,
                visible: true,
                done: '削除する',
                danger: true,
                content: <div className={style.modal}>
                    <div>
                        {targets.join(",")} を削除しますか？
                    </div>
                </div>
            });
        };

        // 選択されているのが 2件以上の場合は LibraryMultiInspector を使う
        if(selectedDatas.length >= 2){
            return <UserListMultiInspector
                selectedDatas={selectedDatas}
                onClickDelete={onClickDelete}
            />;
        }

        const selectedData = selectedDatas[0];

        const onClickPasswordReset = ()=>{
            const name = selectedData.name;
            ModalUtil.emitModal({
                id: Constants.modal.RESET_USER_PASSWORD,
                visible: true,
                done: 'パスワードをリセットする',
                danger: true,
                content: <div className={style.modal}>
                    <div>
                        {name} を仮登録のステータスにして、パスワードを自動的に作られたパスワードに設定しますがよろしいですか？<br/>
                        パスワードを再生成すると現在設定されているパスワードは利用できなくなります。
                    </div>
                </div>
            });
        }
        // 実処理自体は Inspector 内に記述、props に定義がある場合は「仮パスワードの表示」ボタンを表示する
        const onClickShowPassword = ()=>{};

        const {navigation} = props;
        const availablePasswordReset = (navigation && navigation.allowlist && navigation.allowlist.updateUser);
        const availableDelete = (navigation && navigation.allowlist && navigation.allowlist.deleteUser);
        const availableShowPassword = (navigation && navigation.allowlist && navigation.allowlist.readUserPassword);
        const onChangedUserSystemAdminRole = ()=>{
            fetchUsers();
        }

        const onChangedList = ()=>{
            // ユーザー一覧を再更新
            fetchUsers();
            // 選択されているセルを解除（ペインを閉じる）
            clearSelected();
        }

        return <UserListInspector
            navigation={navigation}
            notify={notify}
            selectedData={selectedData}
            onClickShowPassword = {(availableShowPassword)?onClickShowPassword:undefined}
            onClickDelete={(availableDelete)?onClickDelete:undefined}
            onClickPasswordReset={(availablePasswordReset)?onClickPasswordReset:undefined}
            onChangedUserSystemAdminRole={onChangedUserSystemAdminRole}
            onChangedList={onChangedList}
        />
    };

    const clearSelected = () => {
        setSelectedDatas([]);
        setUsers(users.map((user: UserListUser) => {
            user.selected = false;
            return user;
        }));
    };

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
        if (isFinished) {
            setInitialFilterList()
        }
    }, [selectableProjects,isFinished])

    const [filterList, setFilterList] = useState<IFilterCategoryItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState<IFilterCategoryItem | null>(null)

    useEffect(()=>{
        // フィルターが変更される都度ユーザをフィルタリングする
        const {hasNoFilter} = getSelectedFilter();
        if(hasNoFilter){
            fetchUsers(keyword);
        }else{
            filterUsers(users);
        }
    },[filterList])

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

    // 取得済みのユーザーをフィルターする
    const filterUsers = (_users:UserListUser[]) => {
        // 選択されている条件を抽出する
        const {selectedProjectUUIDs,selectedStatusTypes, hasNoFilter} = getSelectedFilter();
        // ユーザーをフィルターする
        let newFilteredUsers = _users;
        // 該当プロジェクトに属しているユーザのみ抽出
        if(selectedProjectUUIDs.length){
            newFilteredUsers = newFilteredUsers.filter((user:UserListUser)=>{
                let hasFound = false
                user.projects.forEach((project:UserProject)=>{
                    // 該当するプロジェクトがあるか
                    selectedProjectUUIDs.forEach((selectedProjectUUID)=>{
                        if(project.uuid === selectedProjectUUID){
                            hasFound = true
                        }
                    })
                })
                return hasFound
            })
        }
        // 該当するステータスのユーザのみ抽出
        if(selectedStatusTypes.length){
            newFilteredUsers = newFilteredUsers.filter((user:UserListUser)=>{
                let hasFound = false
                selectedStatusTypes.forEach((state)=>{
                    if(user.state === state){
                        hasFound = true
                    }
                });
                return hasFound;
            })
        }

        // フィルターしていない場合は、user を再取得する
        if(hasNoFilter){
            // // onClickUserList で行っている setTimeOut による setUsers 処理が終わるのを待つため、
            // // 200ms ほど間隔をあけてから再検索を行う
            setUsers(_users);
            return
        }
        // onClickUserList で行っている setTimeOut による setUsers 処理が終わるのを待つため、
        // 200ms ほど間隔をあけてからフィルタリングする
        setTimeout(()=>{
            setUsers(newFilteredUsers)
        },200)
    }
    // 描画する
    const renderAll = () => {
        const onMouseDownUserList = () => {
            if (clickedUserListCell.current) {
                clearSelected();// 選択状態を一旦解除
                setLastSelectedCell(null);
                clickedUserListCell.current = false;
            }
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
            {renderLoadingIcon()}
            <Flex justifyContent={'center'} fluid={true}>
                {renderInspector()}
                <Flex flexDirection={'row'} width={1480 + 40 + 40} minHeight={'calc(100vh - 64px)'} fluid={true}
                      onMouseDown={onMouseDownUserList}>
                    <Spacer width={40}/>
                    <Flex flexDirection={'column'}>
                        <Spacer height={40}/>
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
                        <Spacer height={30}/>
                        {renderUserList()}
                        <Spacer height={80}/>
                    </Flex>
                    {renderMenuList()}
                    <Spacer width={40}/>
                </Flex>
            </Flex>
            <ModalManager
                notify={notify}
                dismissNotify={dismissNotify}
            />
            <NotificationManager/>
        </>
    };

    return renderAll()
};

export {UserList}