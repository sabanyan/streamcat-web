import React, {useEffect, useState} from "react";
import {Props as NavigationModelProps} from "Model/Navigation/NavigationModel";
import {HttpUtil, WebUtil} from "Utils/index";

interface Props {
    navigation?: NavigationModelProps
}

const baseUrl = "/front_static/";
const NavigationBar = (props: Props) => {
    const [isLogin, setIsLogin] = useState(false);
    const [hasProject, setHasProject] = useState(false);
    const [hasFlow, setHasFlow] = useState(false);

    const renderProjectNavigationItem = () => {
        if (!isLogin) return null;
        return <li className="nav-item list">
            <a className="nav-link" href="/projects">
                <img className="icon" src={baseUrl + "images/icon/list.svg"} />
                プロジェクト
            </a>
        </li>;
    };

    const renderProjectListNavigationItem = () => {
        const {navigation} = props;
        if (!hasProject || !navigation) return null;
        return <li className="nav-item project">
            <a className="nav-link" href={"/flows?project=" + navigation.project_uuid}>
                <img className="icon" src={baseUrl + "images/icon/folder.svg"} />
                {navigation.project_name}
            </a>
        </li>;
    };

    const renderFlowListNavigationItem = () => {
        const {navigation} = props;
        if (!hasFlow || !navigation) return null;
        return <li className="nav-item flow">
            <a className="nav-link" href={"/flows/" + navigation.flow_uuid}>
                <img className="icon" src={baseUrl + "images/icon/flow.svg"} />
                {navigation.flow_name}
            </a>
        </li>;
    };

    const renderLibraryNavigationItem = () => {
        const {navigation} = props;
        if (!hasFlow || !navigation) return null;
        return <li className="nav-item designer">
            <a className="nav-link" href={"/flows/" + navigation.flow_uuid}>
                <img className="icon" src={baseUrl + "images/icon/designer.svg"} />フローデザイナー
            </a>
        </li>;
    };

    const renderFlowDesignerNavigationItem = () => {
        const {navigation} = props;
        //if (!this.hasProject) return null
        return <li className="nav-item library">
            <a className="nav-link" href={"/library"}>
                <img className="icon" src={baseUrl + "images/icon/library.svg"} />ライブラリ
            </a>
        </li>;
    };

    const onClickLogout = (e) => {
        let logoutParam = "?session=off";
        if (location.href.indexOf("?") !== -1) {
            logoutParam = logoutParam.replace("?", "&");
        }
        const url = location.href + logoutParam;
        WebUtil.navigateURL(url);
        e.preventDefault();
    };

    const renderUserNavigationItem = () => {
        const {navigation} = props;
        if (!isLogin || !navigation) return null;

        let depoName;
        if (navigation.depo_name !== "master") {
            depoName = <div>
                <div className="dropdown-item">
                    <b>{navigation.depo_name}</b>
                </div>
                <div className="dropdown-divider"/>
            </div>;
        }

        return <li className="nav-item dropdown user">
            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown"
               aria-haspopup="true" aria-expanded="false">
                <img className="icon" src={baseUrl + "images/icon/user.svg"} />
                {navigation.user_name}
            </a>
            <div className="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink">
                {/*<a href="/profile" className="dropdown-item">プロフィール設定</a>*/}
                {depoName}
                <a href="#" className="dropdown-item" onClick={(e) => onClickLogout(e)}>ログアウト</a>
            </div>
        </li>;

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

    return <nav className="navbar navbar-expand navbar-dark fixed-top">
        <a className="navbar-brand" href="#">
            <img src={baseUrl + "images/logo.png"} height="30" className="d-inline-block align-top"
                 alt="" />
        </a>
        <div className="collapse navbar-collapse breadcrumb-navbar">
            <ul className="navbar-nav mr-auto">
                {renderProjectNavigationItem()}
                {renderProjectListNavigationItem()}
                {renderFlowListNavigationItem()}
            </ul>
        </div>
        <div className="menu-navbar">
            <ul className="navbar-nav">
                {/*{this.renderLibraryNavigationItem()}*/}
                {renderFlowDesignerNavigationItem()}
                {renderUserNavigationItem()}
            </ul>
        </div>
    </nav>;

};

export {NavigationBar}
