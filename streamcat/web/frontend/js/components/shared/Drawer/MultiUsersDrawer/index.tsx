import React from 'react';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';
import { Drawer2 } from 'Shared/Input';
import { DeleteUsersButton } from 'Shared/Button/DeleteUsersButton';

type Props = {
    navigation: NavigationType | null;
    users: UserType[];
    onSuccess:(newUsers:UserType[]) => void;
};

export const MultiUsersDrawer = (props:Props) => {
    const { navigation, users, onSuccess } = props;

    // 全てのユーザが削除可能な場合にtrue
    const allInactive = users.every(user => user.state!=='inactive');

    return <Drawer2>
        {/* 削除ボタン */}
        {
            allInactive ?
            <DeleteUsersButton  navigation={navigation}
                                targets={users}
                                onSuccess={users=>onSuccess(users)} />: <></>
        }
    </Drawer2>;
};
