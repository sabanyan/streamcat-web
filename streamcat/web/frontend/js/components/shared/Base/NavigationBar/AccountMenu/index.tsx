import React from 'react';
import {Menu, MenuItem, Button, Link, Avatar, Divider, Typography} from '@mui/material';
import {WebUtil} from 'Utils/index';
import {NavigationType} from 'Model/Navigation/NavigationModel';
import { Spacer } from "Shared/Base";
import {StorageUsage} from 'Shared/Input'

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
            <Spacer width={8} />
            <Typography color='common.white'>{navigation?.user.name}</Typography>
        </Button>
        <Menu id='basic-menu'
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{'aria-labelledby': 'basic-button'}}>
            <MenuItem>
                {depoName}
            </MenuItem>
            <StorageUsage storageUsage={navigation?.storageUsage} />
            <Divider sx={{my:0.5}} />
            <MenuItem>
                <Link href='/settings/profile' underline='none'>ユーザー情報変更</Link>
            </MenuItem>
            {
                availableUserAdmin ?
                <MenuItem >
                    <Link href='/admin/users' underline='none'>ユーザー管理</Link>
                </MenuItem> :
                // <></>を返すと"MUI: The Menu component doesn't accept a Fragment as a child"
                // という警告が表示される
                null
            }
            <MenuItem onClick={e=>onClickLogout(e)}>
                <Link href='#' underline='none'>ログアウト</Link>
            </MenuItem>
        </Menu>
    </>;
}

export {AccountMenu};
