import React from 'react';
import * as style from './style.scss';
import { NavigationType } from 'Model/Navigation/NavigationModel';
import { ProjectType } from 'Model/Library';
import { CreateUserButton } from 'Shared/Button/CreateUserButton';

interface Props {
    navigation: NavigationType | null;
    allProjects: ProjectType[];
    onSuccess: () => void;
};

export const MenuList = (props: Props) => {
    const {navigation, allProjects, onSuccess} = props;

    return <>{
        navigation && navigation.allowlist && navigation.allowlist.createUser ?
        <div className={style.menuList}>
            <CreateUserButton navigation={navigation} allProjects={allProjects} onSuccess={onSuccess}/>
        </div> :
        <>{/* // ユーザ作成権限がない場合は、メニューを表示しない */}</>
    }</>;
};
