import * as React from 'react';
import {useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';

import {API} from 'Modules/api';
import style from './style.scss';

import {NavigationModel} from 'Model/index';
import {Props as NavigationModelProps} from 'Model/Navigation/NavigationModel';
import {ModalManager} from 'Shared/Modal';
import {addNotification, removeNotification} from 'reapop';

import {Loader, NavigationBar} from 'Shared/Base';
import {Preview} from 'PreviewContainer/Preview';
import {FlowEditor} from 'FlowEditorContainer/FlowEditor';
import {UserList} from 'UserListContainer/UserList';
import {Library} from 'LibraryContainer/Libary';
import {Profile} from 'ProfileContainer/Profile';
import {NotAllowed} from 'Components/NotAllowedContainer';
import {setNetworkStatusAction} from 'Modules/application';
import {NetworkStatusValue} from 'Model/Flow/FlowModel';

export type Props = {
    viewId: ViewId
}

export type State = {
    nav?: NavigationModel
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

const Kskp = (props: Props) => {

    const dispatch = useDispatch();
    const {viewId} = props;

    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };


    const [nav, setNav] = useState<NavigationModelProps | undefined>();

    const getNavigation = () => {
        API.request.doGet.navigation({flowUUID: inject_flow_uuid, projectUUID: inject_project_uuid})
            .then((res) => {
                setNav(API.response.get.navigation(res));
            }, (err) => {
                console.log(err);
            });
    };

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
        if(viewId !== ViewId.Undefined)getNavigation();
        if(viewId === ViewId.Flow_Editor)addNetworkStatusHandler();
    }, []);

    const renderNavigationBar = () => {
        return (
            <div className={style.nav}>
                <NavigationBar navigation={nav} />
            </div>
        );
    };

    const renderView = (viewId: ViewId) => {
        let viewComponent: React.ReactNode = null;
        if(viewId === ViewId.Undefined) return null;
        if (nav === undefined) {
            return <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={true}/>
        }

        switch (viewId) {
            case ViewId.Flow_Editor:
                viewComponent = <FlowEditor navigation={nav}/>;
                break;
            case ViewId.Library:
                viewComponent = <Library navigation={nav}/>;
                break;
            case ViewId.Profile:
                viewComponent = <Profile navigation={nav}/>;
                break;
            case ViewId.Preview:
                viewComponent = <Preview navigation={nav}/>;
                break;
            case ViewId.User_List:
                viewComponent = (nav && nav.allowlist && nav.allowlist.findUsers)?<UserList navigation={nav}/>:<NotAllowed/>;
                break;
            default:
                break;
        }

        return (
            <div className={style.view}>
                {viewComponent}
            </div>
        );
    };


    let result: any = null;

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
        return result;
    }

};

export {Kskp};
