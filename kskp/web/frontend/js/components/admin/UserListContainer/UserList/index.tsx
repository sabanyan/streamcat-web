import * as React from 'react'
import style from './style.scss';
import {useEffect, useRef, useState} from 'react';
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
import {InputForm, TextField} from 'Shared/Input';
import Constants from 'Constants/index';
import Select from 'react-select';
import {LibraryChild} from 'Model/Library';
import UserListInspector from 'Shared/Inspector/UserListInspector';

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
    const [lastSelected, setLastSelected] = useState<UserListUser | null>(null);
    const [selectedDatas, setSelectedDatas] = useState<UserListUser[]>([]);
    const clickedUserListCell = useRef(false);


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
        const onClickCell = (cell: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>) => {
            let data: UserListUser = cell;
            if (event && (event.metaKey || event.ctrlKey)) {
                data.selected = true;
                // command or ctrl + click
                if (selectedDatas.includes(data)) {
                    data.selected = !data.selected;
                    setSelectedDatas(selectedDatas.filter(d => d.uuid !== data.uuid));
                } else {
                    selectedDatas.push(data);
                }
                setLastSelected(data);
            } else if (event && event.shiftKey) {
                // shift + click
                clearSelected();// 選択状態を一旦解除
                let current = users.indexOf(data);
                if (lastSelected) {
                    let last = users.indexOf(lastSelected);
                    let min, max;
                    if (current >= last) {
                        min = last;
                        max = current;
                    } else {
                        min = current;
                        max = last;
                    }
                    const selectedDatas: UserListUser[] = users.slice(min, max + 1).map((libraryChild) => {
                        libraryChild.selected = true;
                        return libraryChild;
                    });
                    setSelectedDatas(selectedDatas);
                }
            } else {
                // 単一選択
                clearSelected();
                data.selected = true;
                setSelectedDatas([data]);
                setLastSelected(data);
            }
            clickedUserListCell.current = true;
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
        const [newUserName, setNewUserName] = useState<string | null>(null);
        const [newUserEmail, setNewUserEmail] = useState<string | null>(null);
        const [selectedOption, setSelectedOption] = useState(null);
        const onClickNewUser = () => {
            // モーダル表示
            const options = [
                {value: 'chocolate', label: 'Chocolate'},
                {value: 'strawberry', label: 'Strawberry'},
                {value: 'vanilla', label: 'Vanilla'},
            ];
            const onSubmit = () => {
                alert('submit')
            };
            ModalUtil.emitModal({
                id: Constants.modal.ADD_USER,
                visible: true,
                done: '作成する',
                content: <div className={style.modal}>
                    <InputForm onSubmit={onSubmit}>
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
                            />
                        </div>
                    </InputForm>
                    <div className={'mt-8px'}/>
                </div>
            });
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
    const renderInspector = ():React.ReactNode => {
        if (!lastSelected) return null;

        clickedUserListCell.current = true;

        const data: UserListUser = lastSelected;
        return <UserListInspector selected={selectedDatas} lastSelected={lastSelected}/>
    };

    const clearSelected = () => {
        setUsers(users.map((user: UserListUser) => {
            user.selected = false;
            return user;
        }));
    };

    // 描画する
    const renderAll = () => {
        const onClickUserList = () => {
            setTimeout(() => {
                if (!clickedUserListCell.current) {
                    clearSelected();// 選択状態を一旦解除
                    setLastSelected(null);
                }
                clickedUserListCell.current = false;
            }, 100);
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