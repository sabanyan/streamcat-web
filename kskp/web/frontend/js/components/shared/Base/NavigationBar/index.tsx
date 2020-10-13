import React, {useEffect, useState} from "react";
import {Props as NavigationModelProps} from "Model/Navigation/NavigationModel";
import {HttpUtil, WebUtil} from "Utils/index";
import {NavigationBarItem} from "Shared/Base/NavigationBar/NavigationBarItem";
import {NavigationBarItemGroup} from "Shared/Base/NavigationBar/NavigationBarItemGroup";
import {NavigationBarMenuGroup} from "Shared/Base/NavigationBar/NavigationBarMenuGroup";
import {NavigationBarBrand} from "Shared/Base/NavigationBar/NavigationBarBrand";
import {NavigationBarGroup} from "Shared/Base/NavigationBar/NavigationBarGroup";
import {NavigationBarUserMenuItem} from "Shared/Base/NavigationBar/NavigationBarUserMenuItem";

interface Props {
    navigation?: NavigationModelProps
}

const baseUrl = "/front_static/";
const NavigationBar = (props: Props) => {
    const [isLogin, setIsLogin] = useState(false);
    const [hasProject, setHasProject] = useState(false);
    const [hasFlow, setHasFlow] = useState(false);

    // const renderProjectNavigationItem = () => {
    //     if (!isLogin) return null;
    //     return <li className="nav-item list">
    //         <a className="nav-link" href="/projects">
    //             <img className="icon" src={baseUrl + "images/icon/list.svg"} />
    //             プロジェクト
    //         </a>
    //     </li>;
    // };

    // const renderProjectListNavigationItem = () => {
    //     const {navigation} = props;
    //     if (!hasProject || !navigation) return null;
    //     return <li className="nav-item project">
    //         <a className="nav-link" href={"/flows?project=" + navigation.project_uuid}>
    //             <img className="icon" src={baseUrl + "images/icon/folder.svg"} />
    //             {navigation.project_name}
    //         </a>
    //     </li>;
    // };

    // const renderFlowListNavigationItem = () => {
    //     const {navigation} = props;
    //     if (!hasFlow || !navigation) return null;
    //     return <li className="nav-item flow">
    //         <a className="nav-link" href={"/flows/" + navigation.flow_uuid}>
    //             <img className="icon" src={baseUrl + "images/icon/flow.svg"} />
    //             {navigation.flow_name}
    //         </a>
    //     </li>;
    // };

    // const renderLibraryNavigationItem = () => {
    //     const {navigation} = props;
    //     if (!hasFlow || !navigation) return null;
    //     return <li className="nav-item designer">
    //         <a className="nav-link" href={"/flows/" + navigation.flow_uuid}>
    //             <img className="icon" src={baseUrl + "images/icon/designer.svg"} />フローデザイナー
    //         </a>
    //     </li>;
    // };

    const renderGlobalNavigationItem = () => {
        const {navigation} = props;
        if (navigation){
            return <NavigationBarItem href={"/library"} iconUrl={baseUrl + "images/icon/library.svg"}>ライブラリ</NavigationBarItem>
        }
        return null
    }

    const renderUserNavigationItem = () => {
        const {navigation} = props;
        let depoName;
        if (navigation && navigation.depo_name !== "master") {
            depoName = <div className="depo-name">
                <div className="dropdown-item">
                    {navigation.depo_name}
                </div>
                <div className="dropdown-divider"/>
            </div>;
        }


        const renderUserAdminMenu = () =>{
            // TODO: ユーザ管理者権限をもつ場合、ユーザ管理画面へのリンクをつける
            const hasUserAdmin = true
            if(hasUserAdmin){
                return <a href="/admin/users" className="dropdown-item">ユーザ管理</a>
            }
            return null
        }

        // ユーザ情報変更画面へのリンク


        const onClickLogout = (e) => {
            let logoutParam = "?session=off";
            if (location.href.indexOf("?") !== -1) {
                logoutParam = logoutParam.replace("?", "&");
            }
            const url = location.href + logoutParam;
            WebUtil.navigateURL(url);
            e.preventDefault();
        };

        return <NavigationBarUserMenuItem navigation={navigation} visible={isLogin}>
            {depoName}
            <a href="/settings/profile" className="dropdown-item">ユーザー情報変更</a>
            {renderUserAdminMenu()}
            <a href="javascript:return false;" className="dropdown-item" onClick={(e) => onClickLogout(e)}>ログアウト</a>
        </NavigationBarUserMenuItem>

    };

    const isDialog = () => {
        return (HttpUtil.getURLParam("dialog"));
    };

    if (isDialog()) return null;
//const {baseUrl} = this.props

    useEffect(()=>{
        if (props.navigation) {
            if (props.navigation.user_id && props.navigation.user_name) {
                setIsLogin(true);
            }
            if (props.navigation.project_uuid && props.navigation.project_name) {
                setHasProject(true);
            }
            if (props.navigation.flow_uuid && props.navigation.flow_name) {
                setHasFlow(true);
            }
        }
    },[props]);

    return <NavigationBarGroup>
        <NavigationBarBrand/>
        <NavigationBarItemGroup>
            {renderGlobalNavigationItem()}
        </NavigationBarItemGroup>
        <NavigationBarMenuGroup>
            {renderUserNavigationItem()}
        </NavigationBarMenuGroup>
    </NavigationBarGroup>;

};

export {NavigationBar}
