import React from 'react';
import style from './style.scss';
import { Stack } from '@mui/material';
import { NotificationManager } from 'Shared/Notification';
import { NavigationType } from 'Model/Navigation/NavigationModel';
import { DownloadDumpButton } from 'Shared/Button/DownloadDumpButton';
import { RestoreDumpButton } from 'Shared/Button/RestoreDumpButton';

type Props = {
    navigation: NavigationType | null;
};

export const System = (props: Props) => {
    const {navigation} = props;

    return <div className={'container mt-40px'}>
        <div className={style.page_title}>システム管理</div>
        <div className={style.card}>
            <legend className={style.card_legend}>システムバックアップ</legend>
            <Stack  direction='column'
                    justifyContent='center'
                    alignItems='flex-start'
                    spacing={3}
                    sx={{p:3}} >
                {/* システムDumpのダウンロード */}
                <DownloadDumpButton navigation={navigation} />
                {/* システムの復元 */}
                <RestoreDumpButton navigation={navigation} />
            </Stack>
        </div>
        <NotificationManager/>
    </div>;
};
