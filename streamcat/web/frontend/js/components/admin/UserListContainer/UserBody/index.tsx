import React from 'react';
import {useEffect, useState} from 'react';
import style from './style.scss';
import { useAsyncResource } from 'use-async-resource';
import {Api} from 'Api';
import {ModalUtil} from 'Utils/index';
import {Flex, Spacer} from 'Shared/Base';
import {MenuList} from 'Components/admin/UserListContainer/MenuList';
import {UserListTable} from 'UserListContainer/UserListTable';
import {ModalManager} from 'Shared/Modal';
import {useStreamCatNotifications} from 'Shared/Notification';
import Constants from 'Constants/index';
import {UserListInspector} from 'Shared/Inspector/UserListInspector';
import {NavigationType, UserType} from 'Model/Navigation/NavigationModel';
import UserListMultiInspector from 'Shared/Inspector/UserListMultiInspector';
import { ProjectType } from 'Model/Library';

const getUsers = (keyword?: string) => {
    const q = keyword;
    const exceptInActive = false;
    const roles = true;
    const projects = true
    return Api.findUsers(q, exceptInActive, roles, projects);
};

interface Props {
    navigation: NavigationType | null;
    allProjects: ProjectType[];
    keyword: string;
    selectedProjects: string[];
    selectedStatuses: string[];
    selectedUsers: [UserType[], (value:React.SetStateAction<UserType[]>)=>void];
};

export const UserBody = (props: Props) => {

    const {
        navigation,
        allProjects,
        keyword,
        selectedProjects,
        selectedStatuses,
    } = props;

    const [selectedUsers, setSelectedUsers] = props.selectedUsers;

    // 全てのユーザを取得する
    const [usersReader, refreshUsers] = useAsyncResource(getUsers, keyword);

    // 通知機能メソッドの取得
    const {notifyError} = useStreamCatNotifications();

    // UserListTableに表示するUserリスト
    const [users, setUsers] = useState(usersReader());

    // kewwordが変更されたら、ユーザを再取得する
    useEffect(() => {
        setUsers(usersReader());
    }, [keyword]);

    useEffect(()=>{
        // ユーザ削除の確認ダイアログ
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const promises = Promise.all(
                    selectedUsers.map(user => deleteUser(user))
                );
                promises.then(() => {
                    // fetchUsers();
                    reloadUsers();
                }).finally(() => {
                    ModalUtil.closeModal(Constants.modal.CONFIRM);
                    clearSelected();
                });
            },
        });

        if(selectedUsers.length === 1){
            const selectedUser = selectedUsers[0];
            // パスワードリセットの処理
            ModalUtil.registerModal({
                id: Constants.modal.RESET_USER_PASSWORD, onClickDone: () => {
                    resetUserPassword(selectedUser).finally(() => {
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
    }, [selectedUsers]);

    // フィルタリングしたusersを取得する
    const filterdUsers = users.filter(user =>
        // Projectが指定されていない場合は全てのUserを抽出する
        selectedProjects.length ===0 ||
        // 指定されたProjectに属するUserを抽出する
        user.projects?.some(project =>
            selectedProjects.includes(project.uuid)
        )
    ).filter(user =>
        // ステータスが指定されていない場合は全てのUserを抽出する
        selectedStatuses.length ===0 ||
        // 指定されたステータスに属するUserを抽出する
        selectedStatuses.includes(user.state)
    );

    const clearSelected = () => {
        setSelectedUsers([]);
    };

    const reloadUsers = () => {
        // // useAsyncResourceが保持するプロジェクトのキャッシュを削除する
        // resourceCache(getUsers).clear();

        // ユーザを再取得する
        getUsers(keyword).then(users =>
            setUsers(users)
        );
    };

    // ユーザを削除する
    const deleteUser = (user: UserType)=>{
        return user.delete().catch(e => {
            notifyError('ユーザー削除エラー', e.message);
        });
    };

    // ユーザのパスワードをリセットする
    const resetUserPassword = (user: UserType) =>{
        return user.resetPassword().then(user => {
            reloadUsers();
        }).catch(e => {
            notifyError('パスワードリセットエラー', e.message);
        });
    };

    // ペインを表示する
    const renderInspector = ():React.ReactNode => {
        if (!selectedUsers.length) return null;

        const onClickDelete = () => {
            let targets: string[] = [];
            selectedUsers.forEach((user) => {
                targets.push(user.name);
            });

            ModalUtil.emitModal({
                id: Constants.modal.CONFIRM,
                visible: true,
                done: '削除する',
                danger: true,
                content: <div className={style.modal}>
                    <div>
                        {targets.join(',')} を削除しますか？
                    </div>
                </div>
            });
        };

        // 選択されているのが 2件以上の場合は LibraryMultiInspector を使う
        if(selectedUsers.length >= 2){
            return <UserListMultiInspector
                selectedUsers={selectedUsers}
                onClickDelete={onClickDelete}
            />;
        }

        const selectedUser = selectedUsers[0];

        const onClickPasswordReset = ()=>{
            const name = selectedUser.name;
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

        const onChangedList = ()=>{
            // ユーザー一覧を再更新
            reloadUsers();
            // 選択されているセルを解除（ペインを閉じる）
            clearSelected();
        }

        return <UserListInspector
            navigation={navigation}
            selectedUser={selectedUser}
            onClickShowPassword = {(availableShowPassword)?onClickShowPassword:undefined}
            onClickDelete={(availableDelete)?onClickDelete:undefined}
            onClickPasswordReset={(availablePasswordReset)?onClickPasswordReset:undefined}
            onChangedUserSystemAdminRole={()=>reloadUsers()}
            onChangedList={onChangedList}
        />
    };

    // 描画する
    return <>
        {/* ユーザリスト */}
        <UserListTable  bodies={filterdUsers}
                        selectedUsers={[selectedUsers, setSelectedUsers]} />

        {/* メニューボタン */}
        <Spacer minWidth={40}/>
        <Flex flexDirection={'column'} fluid={true} width={280}>
            <Spacer height={60}/>
            <MenuList navigation={navigation}
                        allProjects={allProjects}
                        onSuccess={reloadUsers} />
        </Flex>
        {/* ペイン */}
        {renderInspector()}
        <ModalManager />
    </>;

};
