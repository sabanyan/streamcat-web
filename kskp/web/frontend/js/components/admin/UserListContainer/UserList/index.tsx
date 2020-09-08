import * as React from 'react'
import style from './style.scss';
import {useEffect, useState} from 'react';
import {APIUtil, ModalUtil} from 'Utils/index';
import {UserListUser, UserProject, UserRole} from 'Types/index';
import {Flex, Loader, Spacer} from 'Shared/Base';
import {MenuList} from 'UserListContainer/UserList/MenuList';
import {UserListTable} from 'UserListContainer/UserList/UserListTable';
import {ITableBody} from 'UserListContainer/UserList/UserListTable/UserListBody';
import {ModalManager} from 'Shared/Modal';
import {NotificationManager} from 'Shared/Notification';
import {useDispatch} from 'react-redux';
import {addNotification, removeNotification} from 'reapop';

const UserList = () => {
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


    // ユーザ一覧を取得する
    const fetchUsers = () => {
        // APIをたたく
        const params = {
            projects: 'on',
            roles: 'on'
        };
        setIsLoading(true);
        return APIUtil.get('users?projects=' + params.projects + '&roles=' + params.roles).then((response) => {
            const users: UserListUser[] = response.data.data;
            setUsers(users);
            setIsLoading(false);
            setIsFinished(true);
        });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // ローディングアイコンを表示する
    const renderLoadingIcon = () => {
        return <Loader center={true} absolute={true} visible={isLoading}/>
    };

    // ユーザ一覧を表示する
    const renderUserList = () => {
        const onClickCell = () => {

        };
        const onClickFileName = () => {

        };
        const onClickHeader = () => {

        };

        const bodies: ITableBody[] = users.map((user: UserListUser) => {
            let projects = [];
            if (user && user.projects && Array.isArray(user.projects)) {
                projects = user.projects((project: UserProject) => {
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

            const body: ITableBody = {
                admin_types: admin_types,
                clickable: false,
                createdAt: user.createdAt,
                creator: user.creator,
                email: user.email,
                name: user.name,
                projects: projects,
                selected: false,
                status: user.state,
                uuid: user.uuid
            };
            return body
        });


        return <UserListTable bodies={bodies} onClickCell={onClickCell} onClickFileName={onClickFileName}
                              onClickHeader={onClickHeader}/>
    };

    // メニューを表示
    const renderMenuList = () => {
        const onClickNewUser = () => {
            // モーダル表示
            // ModalUtil.emitModal({
            //     id: Constants.modal.ADD_USER,
            //     visible: true,
            //     done: "作成する",
            //     content: <div>
            //         <TextField placeholder={"フロー名"}
            //                    onChange={(e) => setFormFlowName(e.target.value)} />
            //         <div className={"mt-8px"} />
            //     </div>
            // });
        };
        return <>
            <Spacer minWidth={40}/>
            <Flex flexDirection={'column'} fluid={true} width={280}>
                <Spacer height={160}/>
                <MenuList onClickNewUser={onClickNewUser}/>
            </Flex>
        </>
    };

    // ペインを表示
    const renderInspector = () => {

    };

    // 描画する
    const renderAll = () => {
        const onClickUserList = () => {

        };
        return <>
            {renderLoadingIcon()}
            <Flex justifyContent={'center'} fluid={true}>
                {renderInspector()}
                <Flex flexDirection={'row'} width={1480 + 40 + 40} minHeight={'calc(100vh - 64px)'} fluid={true}
                      onClick={onClickUserList}>
                    <Spacer width={40}/>
                    <Flex flexDirection={'column'} fluid={true}>
                        <Spacer height={40}/>
                        <div className={style.pageTitleHeader}>
                            <div className={style.pageTitle}>
                                ユーザー管理
                            </div>
                            <div className={style.searchBarContainer}>
                                <input type={'text'} placeholder={'ユーザー名、E-mail で絞り込む'} className={'form-control'}/>
                            </div>
                        </div>

                        <Spacer height={20}/>
                        <div className={style.resultCount}>
                            表示されている件数 {users.length}件
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