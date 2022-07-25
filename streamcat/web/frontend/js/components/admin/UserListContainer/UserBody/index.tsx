import React from 'react';
import {useEffect, useState} from 'react';
import Select from 'react-select';
import style from './style.scss';
import {Api} from 'Api';
import {APIUtil, ModalUtil, ReactDomUtil, ErrorUtil} from 'Utils/index';
import {Flex, Spacer} from 'Shared/Base';
import {MenuList} from 'Components/admin/UserListContainer/MenuList';
import {UserListTable} from 'UserListContainer/UserListTable';
import {ITableBody} from 'UserListContainer/UserListTable/UserListBody';
import {ModalManager} from 'Shared/Modal';
import {useStreamCatNotifications} from 'Shared/Notification';
import {TextField} from 'Shared/Input';
import Constants from 'Constants/index';
import {UserListInspector} from 'Shared/Inspector/UserListInspector';
import {ITableHeader} from 'LibraryContainer/FileListTable/FileListHeader';
import * as lodash from 'lodash';
import {NavigationType} from 'Model/Navigation/NavigationModel';
import UserListMultiInspector from 'Shared/Inspector/UserListMultiInspector';
import { UserType2 } from 'Components/admin/UserListContainer/UserList'
import { ProjectType } from 'Model/Library';

interface Props {
    navigation: NavigationType | null;
    keyword: string;
    selectedProjectUUIDs: string[];
    selectedStatusTypes: string[];
    hasNoFilter: boolean;
    selectableProjects: ProjectType[];
    lastSelectedCell: [UserType2|null, (value:React.SetStateAction<UserType2|null>)=>void];
    selectedDatas: [UserType2[], (value:React.SetStateAction<UserType2[]>)=>void];
};

export const UserBody = (props: Props) => {
    const {
        keyword,
        selectedProjectUUIDs,
        selectedStatusTypes,
        hasNoFilter,
        selectableProjects,
    } = props;

    const [lastSelectedCell, setLastSelectedCell] = props.lastSelectedCell;
    const [selectedDatas, setSelectedDatas] = props.selectedDatas;

    // 通知機能メソッドの取得
    const {notifyError} = useStreamCatNotifications();

    // UserListTableに表示するUserリスト
    const [users, setUsers] = useState<UserType2[]>([]);

    // ユーザ一覧を取得する
    const fetchUsers = (keyword?: string) => {
        return Api.findUsers(keyword, false, true, true).then(users => {
            // 取得したUserを条件に従いフィルタリングする
            filterUsers(
                users.map(user => ({
                    selected: false,
                    ...user
                }))
            );
        }).catch((error) => {
            console.log(error);
            notifyError('ユーザー一覧取得エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)));
        });
    };

    // ユーザを新規に作成する
    const createNewUser = async (name: string, email: string, projectUUIDs: string[] | null ) => {
        return Api.createUser(email, name).then(user => {
            // UserをProjectに参加させる
            joinProject(user.uuid, projectUUIDs || []);
            return user;
        }).catch(e => {
            notifyError('ユーザー作成エラー', e.message);
        });
    };

    // ユーザをプロジェクトに紐付ける
    const joinProject = (userUUID: string, projectUUIDs: string[]) => {
        projectUUIDs.forEach(projectUUID => {
            const url = 'projects/' + projectUUID + '/users/' + userUUID;
            const body = {
                'memberType': 'Reader'
            };
            (async() => {
                const response = await APIUtil.put(url, body).catch(error => {
                    ErrorUtil.notifyError(notifyError, 'プロジェクト追加エラー', error)
                    return Promise.reject()
                });
                if (!response.data.success) {
                    ErrorUtil.notifyError(notifyError, 'プロジェクト追加エラー', response.data.message)
                    return Promise.reject()
                }
                return Promise.resolve(response);
            })();
        });
    }

    // ユーザを削除する
    const deleteUser = (user: UserType2)=>{
        return user.delete().catch(e => {
            notifyError('ユーザー削除エラー', e.message);
        });
    };

    // ユーザのパスワードをリセットする
    const resetUserPassword = (user: UserType2) =>{
        return user.resetPassword().then(user => {
            fetchUsers();
        }).catch(e => {
            notifyError('パスワードリセットエラー', e.message);
        });
    };

    useEffect(()=>{
        if(selectedDatas.length === 1){
            const selectedData = selectedDatas[0];
            // パスワードリセットの処理
            ModalUtil.registerModal({
                id: Constants.modal.RESET_USER_PASSWORD, onClickDone: () => {
                    resetUserPassword(selectedData).finally(() => {
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
    }, [selectedDatas]);

    useEffect(()=>{
        // ユーザ削除の確認ダイアログ
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const promises = Promise.all(
                    selectedDatas.map(user => deleteUser(user))
                );
                promises.then(() => {
                    fetchUsers();
                }).finally(() => {
                    ModalUtil.closeModal(Constants.modal.CONFIRM);
                    clearSelected();
                });
            },
        })
    },[selectedDatas]);

    // ユーザ一覧を表示する
    const renderUserList = () => {
        const onClickCell = (cell: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>) => {
            let data = users.find(user=>(cell.uuid === user.uuid));
            if(!data){
                return;
            }
            let selectedUser = data;
            if (event) event.stopPropagation();
            if (event && (event.metaKey || event.ctrlKey)) {
                selectedUser.selected = true;
                // command or ctrl + click
                if (selectedDatas.includes(selectedUser)) {
                    selectedUser.selected = !selectedUser.selected;
                    setSelectedDatas(selectedDatas.filter(d => d.uuid !== selectedUser.uuid));
                    if(!selectedUser.selected){
                        setLastSelectedCell(null);
                    }
                } else {
                    selectedDatas.push(selectedUser);
                    setLastSelectedCell(selectedUser);
                }
            } else if (event && event.shiftKey) {
                // shift + click
                clearSelected();// 選択状態を一旦解除
                let current = users.findIndex(user=> selectedUser.uuid === user.uuid);
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
                    const selectedDatas: UserType2[] = users.slice(min, max + 1).map((user) => {
                        user.selected = true;
                        return user;
                    });
                    setSelectedDatas(selectedDatas);
                }
            } else {
                // 単一選択
                clearSelected();
                selectedUser.selected = true;
                setSelectedDatas([selectedUser]);
                setLastSelectedCell(selectedUser);
            }
        };

        const onClickFileName = () => {
        };

        const onClickHeader= (header: ITableHeader) => {
            if (header.sort) {
                if(header.key === "projects"){
                    setUsers(lodash.orderBy(users, (e: UserType2)=>{
                        const projects = e.projects?.length || 0;
                        return projects
                    }, header.sort));
                }else if(header.key === "admin_types"){
                    setUsers(lodash.orderBy(users, (e: UserType2)=>{
                        const roles = e.roles?.filter(role => (role.systemRole != "EVERYONE")) || [];
                        return JSON.stringify(roles)
                    }, header.sort));
                } else{
                    setUsers(lodash.orderBy(users, header.key, header.sort));
                }
            } else {
                fetchUsers()
            }
        }

        const bodies: ITableBody[] = users.map((user: UserType2) => {
            let projects: {uuid: string, label: string}[] = [];
            if (user && Array.isArray(user.projects) && user.projects ) {
                projects = user.projects.map(project => {
                    return {
                        uuid: project.uuid,
                        label: project.label
                    }
                });
            }

            let admin_types: {uuid: string, systemRole: string}[] =[];
            if (user && user.roles && Array.isArray(user.roles)) {
                admin_types = user.roles.map(role => {
                    return {
                        systemRole: role.systemRole,
                        uuid: role.uuid
                    }
                })
            }

            let selected = false;
            selectedDatas.forEach((selectedUser:UserType2)=>{
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
    const [selectedOption, setSelectedOption] = useState<ProjectType | null>(null);


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
                createNewUser(newUserName,newUserEmail, projectUUIDs).then(user => {
                    fetchUsers();
                    if(!user){
                        notifyError('ユーザー作成エラー');
                        ModalUtil.closeModal(Constants.modal.ADD_USER)
                        clearField();
                        return
                    }
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
                                    <div>名前: {user.name}</div>
                                    <div>Email: {user.email}</div>
                                    {project}
                                    <div>仮パスワード: {user.password}</div>
                                </div>
                            </form>
                            <div className={'mt-8px'}/>
                        </div>
                    });
                    clearField();
                }).catch(() => {
                    ModalUtil.closeModal(Constants.modal.ADD_USER)
                })
            }, onClickCancel: ()=>{
                clearField();
            }
        })
    },[newUserEmail,newUserName, selectedOption]);

    const clearField = () =>{
        setNewUserName("");
        setNewUserEmail("");
        setSelectedOption(null);
    };

    // メニューを表示
    const renderMenuList = () => {

        const onClickNewUser = () => {
            // モーダル表示
            const options = selectableProjects.map(project => {
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
                                onChange={selectedProjects => {
                                    selectedProjects.forEach(project => setSelectedOption(project))
                                }}
                                options={selectableProjects}
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
                <Spacer height={60}/>
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
        setUsers(users.map((user: UserType2) => {
            user.selected = false;
            return user;
        }));
    };

    useEffect(()=>{
        // フィルターが変更される都度ユーザをフィルタリングする
        const {hasNoFilter} = props;
        if(hasNoFilter){
            fetchUsers(keyword);
        }else{
            filterUsers(users);
        }
    },[selectedProjectUUIDs, selectedStatusTypes, hasNoFilter])

    // 取得済みのユーザーをフィルターする
    const filterUsers = (_users:UserType2[]) => {
        // 選択されている条件を抽出する
        const {selectedProjectUUIDs, selectedStatusTypes, hasNoFilter} = props;
        // ユーザーをフィルターする
        let newFilteredUsers = _users;
        // 該当プロジェクトに属しているユーザのみ抽出
        if(selectedProjectUUIDs.length){
            newFilteredUsers = newFilteredUsers.filter((user:UserType2)=>{
                let hasFound = false
                user.projects?.forEach(project => {
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
            newFilteredUsers = newFilteredUsers.filter((user:UserType2)=>{
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
    return <>
        {renderUserList()}
        {renderMenuList()}
        {renderInspector()}
        <ModalManager />
    </>;

};
