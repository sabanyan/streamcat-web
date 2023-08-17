import React from 'react';
import {Box, Typography} from '@mui/material';
import { Button2, FixedField2 } from 'Shared/Input';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';

type Props = {
    navigation: NavigationType | null;
    user: UserType;
};

/**
 * 仮パスワード
 * @param props
 */
export const TmpPasswordField = (props:Props) => {
    const {navigation, user} = props;

    // 仮パスワードの表示状態
    const [showPassword, setShowPassword] = React.useState(false);

    // 仮パスワードの参照が可能な場合にTrue
    const enabled = navigation && navigation.allowlist && navigation.allowlist.readUserPassword;

    if(showPassword){
        return <FixedField2 label='仮パスワード' value={user.password || ''} />;
    }else{
        return <>
            <Typography variant='caption'
                        color='textSecondary'
                        sx={{lineHeight:'0'}}>仮パスワード</Typography>
            <Box paddingLeft={1}>
                <Button2 large={false}
                        disabled={!enabled}
                        onClick={() => setShowPassword(true)}>表示する</Button2>
            </Box>
        </>;
    }
};
