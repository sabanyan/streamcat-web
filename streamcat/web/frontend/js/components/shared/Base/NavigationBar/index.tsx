import React, {useEffect, useState} from "react";
import {NavigationType} from "Model/Navigation/NavigationModel";
import {HttpUtil} from "Utils/index";
import {NavigationBarItem} from "Shared/Base/NavigationBar/NavigationBarItem";
import {NavigationBarItemGroup} from "Shared/Base/NavigationBar/NavigationBarItemGroup";
import {AccountMenu} from "Components/shared/Base/NavigationBar/AccountMenu";
import {NavigationBarBrand} from "Shared/Base/NavigationBar/NavigationBarBrand";
import {NavigationBarGroup} from "Shared/Base/NavigationBar/NavigationBarGroup";

interface Props {
    navigation: NavigationType | null;
}

const baseUrl = "/front_static/";
const NavigationBar = (props: Props) => {
    const {navigation} = props;
    const [isLogin, setIsLogin] = useState(false);

    const renderGlobalNavigationItem = () => {
        if (navigation){
            return <NavigationBarItem href={"/library"} iconUrl={baseUrl + "images/icon/library.svg"}>ライブラリ</NavigationBarItem>
        }
        return null
    }

    const isDialog = () => {
        return (HttpUtil.getURLParam("dialog"));
    };

    if (isDialog()) return null;

    useEffect(()=>{
        if (props.navigation) {
            if (props.navigation.user.uuid) {
                setIsLogin(true);
            }
        }
    },[props]);

    return <NavigationBarGroup>
        <NavigationBarBrand/>
        <NavigationBarItemGroup>
            {renderGlobalNavigationItem()}
        </NavigationBarItemGroup>
        <AccountMenu navigation={navigation} visible={isLogin}/>
    </NavigationBarGroup>;

};

export {NavigationBar}
