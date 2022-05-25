import React from 'react';
import { AppBar, Box, Toolbar } from '@mui/material';
import { AccountMenu } from './AccountMenu';
import {NavigationType} from "Model/Navigation/NavigationModel";

interface Props {
    navigation: NavigationType | null;
};

export const NavigationBar = (props: Props) => {
    const {navigation} = props;

    const baseUrl = '/front_static/';

    const isLogin = !!navigation?.user.uuid;

    // StreamCatのロゴ
    // 押下するとライブラリのプロジェクト一覧画面に遷移する
    const logo = <a href='/library' className='navbar.navbar-brand'>
        {/* CSSからの画像サイズの設定が反映できないのでstyle属性で直接指定した */}
        <img src={baseUrl + 'images/logo.png'} alt='🐈' style={{height:'25px'}} />
    </a>;

    return <Box sx={{ flexGrow:1 }}>
        <AppBar><Toolbar>
            {logo}
            <Box sx={{ flexGrow:1 }} />
            <AccountMenu navigation={navigation} visible={isLogin}/>
        </Toolbar></AppBar>
    </Box>;
};
