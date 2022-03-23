import React from 'react';
import {Menu, MenuItem, Button, Link, Avatar, Divider, Box} from '@mui/material';
import {WebUtil} from 'Utils/index';
import {NavigationType} from 'Model/Navigation/NavigationModel';

interface Props {
    navigation: NavigationType | null;
    visible: boolean;
}

const AccountMenu = (props: Props) => {
    const {navigation, visible} = props;

    // 非表示の場合はnullを返す
    if(!visible){
        return null;
    }

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const onClickLogout = (e) => {
        e.preventDefault();
        WebUtil.logout();
    };

    const baseUrl = '/front_static/';

    let depoName;
    if (navigation) {
        // master Depoの場合はVersionを、それ以外の場合はDepo名を表示する
        depoName = navigation.depoName==='master' ? navigation.version : navigation.depoName;
    }else{
        depoName = '';
    }

    // ユーザー管理画面へのリンクの表示有無を判定する
    const availableUserAdmin = (navigation && navigation.allowlist && navigation.allowlist.findUsers)

    return <>
        <Button id='basic-button'
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}>
            <Avatar src={baseUrl + 'images/icon/user.svg'} variant='rounded' sx={{width:24, height:24}}/>
            <Box sx={{p:1}}/>
            {navigation?.user.name}
        </Button>
        <Menu id='basic-menu'
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{'aria-labelledby': 'basic-button'}}>
            <MenuItem>
                {depoName}
            </MenuItem>
            <Divider sx={{my:0.5}} />
            <MenuItem>
                <Link href='/settings/profile' underline='none'>ユーザー情報変更</Link>
            </MenuItem>
            <MenuItem>
                {availableUserAdmin ? <Link href='/admin/users' underline='none'>ユーザー管理</Link> : null}
            </MenuItem>
            <MenuItem onClick={e=>onClickLogout(e)}>
                <Link href='#' underline='none'>ログアウト</Link>
            </MenuItem>
        </Menu>
    </>;
}

export {AccountMenu};
