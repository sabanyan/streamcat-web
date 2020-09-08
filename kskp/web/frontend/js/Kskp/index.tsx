import * as React from "react";
import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";

import {API} from "Modules/api";
import style from "./style.scss";

import {NavigationModel} from "Model/index";
import {Props as NavigationModelProps} from "Model/Navigation/NavigationModel";
import {ModalManager} from "Shared/Modal";
import {addNotification, removeNotification} from "reapop";

import {
    ProfileContainer,
} from "Components/index";
import {NavigationBar} from "Shared/Base";
import {Preview} from "PreviewContainer/Preview";
import {FlowEditor} from "FlowEditorContainer/FlowEditor";
import {UserList} from 'UserListContainer/UserList';
import {Library} from 'LibraryContainer/Libary';

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

    useEffect(() => {
        getNavigation();
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
        switch (viewId) {
            case ViewId.Flow_Editor:
                viewComponent = <FlowEditor />;
                break;
            case ViewId.Library:
                viewComponent = <Library />;
                break;
            case ViewId.Profile:
                viewComponent = <ProfileContainer />;
                break;
            case ViewId.Preview:
                viewComponent = <Preview />;
                break;
            case ViewId.User_List:
                viewComponent = <UserList/>;
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
