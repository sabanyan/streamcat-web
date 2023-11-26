import React from 'react';
import { useAsyncResource } from 'use-async-resource';
import { Api } from 'Api';
import { ProjectType } from 'Model/Library';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';
import { Flex, Spacer } from 'Shared/Base';
import { UserListTable } from 'UserListContainer/UserListTable';
import { MenuList } from 'Components/admin/UserListContainer/MenuList';
import { UserDrawer } from 'Shared/Drawer/UserDrawer';
import { MultiUsersDrawer } from 'Shared/Drawer/MultiUsersDrawer';

const getUsers = (keyword?: string) => {
    const q = keyword;
    const exceptInActive = false;
    const roles = true;
    const projects = true
    return Api.findUsers(q, exceptInActive, roles, projects);
};

type Props = {
    navigation: NavigationType | null;
    allProjects: ProjectType[];
    keyword: string;
    selectedProjects: string[];
    selectedStatuses: string[];
    selectedUsers: [UserType[], (value:React.SetStateAction<UserType[]>)=>void];
    onSuccess: (newUsers:UserType[]) => void;
};

export const UserBody = (props: Props) => {
    const {
        navigation,
        allProjects,
        keyword,
        selectedProjects,
        selectedStatuses
    } = props;

    // 選択中のユーザ
    const [selectedUsers, setSelectedUsers] = props.selectedUsers;
    // 全てのユーザを取得する
    const [usersReader, refreshUsers] = useAsyncResource(getUsers, keyword);
    // UserListTableに表示するUserリスト
    const [users, setUsers] = React.useState(usersReader());

    // kewwordが変更されたら、ユーザを再取得する
    React.useEffect(() => {
        setUsers(usersReader());
    }, [keyword]);

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

    const onSuccess = (newUsers: UserType[]) => {
        // ユーザを再取得する
        getUsers(keyword).then(latestUsers => {
            setUsers(latestUsers)
            // 選択中のユーザを再取得したユーザで更新する
            setSelectedUsers(
                latestUsers.filter(user =>
                    -1 !== selectedUsers.findIndex(selectedUser =>
                        selectedUser.uuid===user.uuid
                    )
                )
            );
        });
        // コールバック関数を実行する
        props.onSuccess(newUsers);
    };

    return <>
        <Flex flexDirection={'row'}>
            {/* ユーザリスト */}
            <UserListTable  allUsers={filterdUsers}
                            selectedUsers={[selectedUsers, setSelectedUsers]} />
            {/* メニューボタン */}
            <Spacer minWidth={40}/>
            <Flex flexDirection={'column'} fluid={true} width={280}>
                <Spacer height={60}/>
                <MenuList navigation={navigation}
                        allProjects={allProjects}
                        onSuccess={newUser => onSuccess([newUser])} />
            </Flex>
        </Flex>
        {/* ペイン */}
        {
            selectedUsers.length===0 ?
            <></> :
            selectedUsers.length===1 ?
            <UserDrawer navigation={navigation}
                        user={selectedUsers[0]}
                        onSuccess={newUser => onSuccess([newUser])} /> :
            <MultiUsersDrawer navigation={navigation}
                              users={selectedUsers}
                              onSuccess={onSuccess} />
        }
    </>;
};
