import React from 'react';
import {useAsyncResource, AsyncResourceContent} from 'use-async-resource';
import { createTheme, ThemeProvider } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import {NotificationsProvider} from 'reapop';
import style from './style.scss';
import {ModalManager} from 'Shared/Modal';
import {NavigationBar} from 'Shared/Base';
import {Preview} from 'PreviewContainer/Preview';
import {FlowEditor} from 'FlowEditorContainer/FlowEditor';
import {UserList} from 'Components/admin/UserListContainer/UserList';
import {Library} from 'LibraryContainer/Libary';
import {Profile} from 'ProfileContainer/Profile';
import {NotAllowed} from 'Components/NotAllowedContainer';
import {Api} from 'Api';
import HttpUtil from 'Utils/HttpUtil';

export type Props = {
    viewId: ViewId
}

export enum ViewId {
    Flow_Editor,
    Flow_List,
    Library,
    Profile,
    Project_List,
    Preview,
    TrashCan,
    User_List,
    Undefined = -1,
}

const getNavigation = (viewId: ViewId) => {
    if(viewId !== ViewId.Undefined){
        return Api.findNavigation();
    }else{
        // Login画面の場合はAPIを発行しない
        return Api.findNull();
    }
}

const StreamCat = (props: Props) => {
    const {viewId} = props;

    // Navigationの取得を開始する
    const [readNavigation] = useAsyncResource(getNavigation, viewId);

    // Webブラウザの設定に従って、ライト/ダークテーマを設定する
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = React.useMemo(
        () => createTheme({palette: {mode:prefersDarkMode? 'dark': 'light'}}),
        [prefersDarkMode],
    );

    // Navigationを取得する
    const nav = readNavigation();

    const renderNavigationBar = () => {
        const isDialog = HttpUtil.getURLParam("dialog");
        if(isDialog){
            return <></>;
        }else{
            return <div className={style.nav}>
                <NavigationBar navigation={nav} />
            </div>;
        }
    };

    const renderView = (viewId: ViewId) => {
        let viewComponent: React.ReactNode = null;
        if(viewId === ViewId.Undefined) return null;

        switch (viewId) {
            case ViewId.Flow_Editor:
                viewComponent = <FlowEditor/>;
                break;
            case ViewId.Library:
                viewComponent = <Library/>;
                break;
            case ViewId.Profile:
                viewComponent = <Profile navigation={nav}/>;
                break;
            case ViewId.Preview:
                viewComponent = <Preview/>;
                break;
            case ViewId.User_List:
                viewComponent = (nav && nav.allowlist && nav.allowlist.findUsers)?<UserList navigation={nav}/>:<NotAllowed/>;
                break;
            default:
                break;
        }

        return (
            <AsyncResourceContent fallback={<p>Loading...</p>}>
            <div className={style.view}>
                {viewComponent}
            </div>
            </AsyncResourceContent>
        );
    };

    try {
        return <div className={style.streamcat}>
            {/* 通知ダイアログ */}
            <NotificationsProvider>
            {/* MUIのテーマ */}
            <ThemeProvider theme={theme}>
                {renderNavigationBar()}
                {renderView(viewId)}
                <ModalManager />
            </ThemeProvider>
            </NotificationsProvider>
        </div>;
    } catch (e) {
        console.log(e);
        return null;
    }

};

export {StreamCat};
