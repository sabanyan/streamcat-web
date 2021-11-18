import * as React from 'react';
import {useEffect} from 'react';
import {useAsyncResource, AsyncResourceContent} from 'use-async-resource';
import {useDispatch} from 'react-redux';
import style from './style.scss';
import {ModalManager} from 'Shared/Modal';
import {addNotification, removeNotification} from 'reapop';
import {NavigationBar} from 'Shared/Base';
import {Preview} from 'PreviewContainer/Preview';
import {FlowEditor} from 'FlowEditorContainer/FlowEditor';
import {UserList} from 'UserListContainer/UserList';
import {Library} from 'LibraryContainer/Libary';
import {Profile} from 'ProfileContainer/Profile';
import {NotAllowed} from 'Components/NotAllowedContainer';
import {setNetworkStatusAction} from 'Modules/flowEditor';
import {NetworkStatusValue} from 'Model/Flow/FlowModel';
import { APIUtil2 } from 'Utils/APIUtil2';

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
        return APIUtil2.findNavigation();
    }else{
        // Login画面の場合はAPIを発行しない
        return APIUtil2.findNull();
    }
}

const Kskp = (props: Props) => {

    const dispatch = useDispatch();
    const {viewId} = props;

    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };

    // Navigationの取得を開始する
    const [readNavigation] = useAsyncResource(getNavigation, viewId);

    const addNetworkStatusHandler = ()=>{
        const getNavigatorNetworkStatus = () => {
            if(navigator.onLine){
                return NetworkStatusValue.Online;
            }else{
                return NetworkStatusValue.Offline;
            }
        }
        const dispatchNetworkStatus = ()=>{
            dispatch(setNetworkStatusAction(getNavigatorNetworkStatus()));
        }
        dispatchNetworkStatus();
        window.addEventListener("online",dispatchNetworkStatus);
        window.addEventListener("offline",dispatchNetworkStatus);
    }

    useEffect(() => {
        // if(viewId !== ViewId.Undefined)getNavigation();
        if(viewId === ViewId.Flow_Editor)addNetworkStatusHandler();
    }, []);


    // Navigationを取得する
    const nav = readNavigation();

    const renderNavigationBar = () => {
        return <div className={style.nav}>
            <NavigationBar navigation={nav} />
        </div>;
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
        return <div className={style.kskp}>
            {renderNavigationBar()}
            {renderView(viewId)}
            <ModalManager
                notify={notify}
                dismissNotify={dismissNotify}
            />
        </div>;
    } catch (e) {
        console.log(e);
        return null;
    }

};

export {Kskp};
