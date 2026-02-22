import React from 'react';
import * as style from './style.scss';
import { suspend } from 'suspend-react';
import { Stack } from '@mui/material';
import { Api } from 'Api';
import { NotificationManager } from 'Shared/Notification';
import { NavigationType, SelfUserType } from 'Model/Navigation/NavigationModel';
import { ChangePasswordButton } from 'Shared/Button/ChangePasswordButton';
import { UserBox } from '../UserBox';

type Props = {
    navigation: NavigationType | null;
};

export const Profile = (props: Props) => {
    const {navigation} = props;

    // ログインユーザ
    const [selfUser, setSelfUser] = React.useState<SelfUserType>(
        // ログインUserを取得する
        suspend(Api.findSelfUser, [])
    );

    return <div className={'container mt-40px'}>
        <div className={style.page_title}>ユーザー情報変更</div>
        <div className={style.card}>
            <Stack  direction='column'
                    justifyContent='center'
                    alignItems='flex-start'
                    spacing={3}
                    sx={{p:3}} >
                <UserBox selfUser={selfUser}
                         navigation={navigation}
                         onSuccess={selfUser => setSelfUser(selfUser)}/>
            </Stack>
        </div>
        <div className={style.card}>
            <Stack  direction='column'
                    justifyContent='center'
                    alignItems='flex-start'
                    spacing={3}
                    sx={{p:3}} >
                <ChangePasswordButton
                    selfUser={selfUser}
                    navigation={navigation}
                    onSuccess={selfUser => setSelfUser(selfUser)} />
            </Stack>
        </div>
        <NotificationManager/>
    </div>;
};
