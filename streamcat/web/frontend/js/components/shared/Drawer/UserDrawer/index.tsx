import React from 'react';
import { Box, Typography } from '@mui/material';
import AdminUtil from 'Utils/AdminUtil';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';
import { Drawer2, FixedField2, List2 } from 'Shared/Input';
import { DeleteUsersButton } from 'Shared/Button/DeleteUsersButton';
import { ResetPasswordButton } from 'Shared/Button/ResetPasswordButton';
import { PutbackUserButton } from 'Shared/Button/PutbackUserButton';
import { TmpPasswordField } from 'Shared/Input/TmpPasswordField';
import { AdminCheckbox } from 'Shared/Input/AdminCheckbox';

type Props = {
    navigation: NavigationType | null;
    user: UserType;
    onSuccess:(newUser:UserType) => void;
};

export const UserDrawer = (props:Props) => {
    const { navigation, user, onSuccess } = props;

    // 所属プロジェクト
    const projects = user.projects || [];

    return <Drawer2>
        <Box>
            {/* 削除ボタン */}
            {
                user.state !== 'inactive'?
                <DeleteUsersButton navigation={navigation}
                                   targets={[user]}
                                   onSuccess={users=>onSuccess(users[0])} />: <></>
            }
            {/* パスワードリセットボタン */}
            {
                user.state === 'active'|| user.state === 'expired'?
                <ResetPasswordButton navigation={navigation}
                                     user={user}
                                     onSuccess={onSuccess} />: <></>
            }
            {/* 利用中に戻すボタン */}
            {
                user.state === 'inactive'?
                <PutbackUserButton navigation={navigation}
                                   user={user}
                                   onSuccess={onSuccess} />: <></>
            }
        </Box>
        <FixedField2 key='name'
                     label='名前'
                     value={user.name} />
        <FixedField2 key='email'
                     label='E-mail'
                     value={user.email} />
        <List2  label={`所属プロジェクト(${projects.length})`}
                items={projects.map(project => project.label)} />
        <FixedField2 key='state'
                     label='ステータス'
                     value={AdminUtil.getUserStatus(user.state)} />
        {/* 仮パスワード */}
        {
            user.state === 'tmp'?
            <TmpPasswordField navigation={navigation} user={user} />: <></>
        }
        {/* 管理権限 */}
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>管理権限</Typography>
        <Box paddingLeft={1}>
            {/* システム管理権限 */}
            <AdminCheckbox  key={'sys'+user.uuid}
                            navigation={navigation}
                            whichAdmin='sys'
                            user={user}
                            onSuccess={onSuccess} />
            {/* ユーザー管理権限 */}
            <AdminCheckbox  key={'usr'+user.uuid}
                            navigation={navigation}
                            whichAdmin='usr'
                            user={user}
                            onSuccess={onSuccess} />
        </Box>
    </Drawer2>;
};
