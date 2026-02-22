import React, { Suspense } from 'react';
import { suspend } from 'suspend-react';
import { createTheme, ThemeProvider } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import {NotificationsProvider} from 'reapop';
import {Api} from 'Api';
import {ModalManager} from 'Shared/Modal';
import {NavigationBar} from 'Shared/Base';
import {Preview} from 'PreviewContainer/Preview';
import {FlowEditor} from 'FlowEditorContainer/FlowEditor';
import {System} from 'Components/admin/SystemContainer/System';
import {UserList} from 'UserListContainer/UserList';
import {Library} from 'LibraryContainer/Libary';
import {Profile} from 'ProfileContainer/Profile';
import {NotAllowed} from 'Components/NotAllowedContainer';
import HttpUtil from 'Utils/HttpUtil';

export type Props = {
    viewId: ViewId
};

export enum ViewId {
    Flow_Editor,
    Library,
    Profile,
    Preview,
    TrashCan,
    System,
    User_List,
    // Login画面の場合はViewIdが未定義
    Undefined = -1,
};

const isDialog = HttpUtil.getURLParam('dialog');

const getNavigation = (viewId: ViewId) => {
    if( isDialog || viewId===ViewId.Undefined){
        // ダイアログ表示の場合はAPIを発行しない
        // また、ログイン画面の場合もAPIを発行しない
        return Api.findNull();
    }else{
        return Api.findNavigation();
    }
};

export const StreamCat = (props: Props) => {
    const {viewId} = props;

    // Navigationを取得する
    const nav = suspend(getNavigation, [viewId]);

    // Webブラウザの設定に従って、ライト/ダークテーマを設定する
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = React.useMemo(
        () => createTheme({palette: {mode:prefersDarkMode? 'dark': 'light'}}),
        [prefersDarkMode],
    );

    const renderNavigationBar = () => {
        if(isDialog){
            return <></>;
        }else{
            return <div>
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
            case ViewId.System:
                viewComponent = (nav && nav.allowlist && nav.allowlist.setSystem)?<System navigation={nav}/>:<NotAllowed/>;
                break;
            case ViewId.User_List:
                viewComponent = (nav && nav.allowlist && nav.allowlist.findUsers)?<UserList navigation={nav}/>:<NotAllowed/>;
                break;
            default:
                break;
        }

        return (
            <Suspense fallback={<p>Loading...</p>}>
            <div>
                {viewComponent}
            </div>
            </Suspense>
        );
    };

    try {
        return <div>
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
