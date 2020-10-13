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


        const renderUserAdminMenu = () => {
            const {navigation} = props;
            const availableUserAdmin = (navigation && navigation.allowlist && navigation.allowlist.findUsers)
            if (availableUserAdmin) {
                return <a href="/admin/users" className="dropdown-item">ユーザー管理</a>
            }
            return null
        }

        const onClickLogout = (e) => {
            let logoutParam = "?session=off";
            if (location.href.indexOf("?") !== -1) {
                logoutParam = logoutParam.replace("?", "&");
            }
            const url = location.href + logoutParam;
            WebUtil.navigateURL(url);
            e.preventDefault();
        };

        const renderUserSettingsMenu = ()=>{
            return <a href="/settings/profile" className="dropdown-item">ユーザー情報変更</a>
        }

        return <NavigationBarUserMenuItem navigation={navigation} visible={isLogin}>
            {depoName}
            {renderUserSettingsMenu()}
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
