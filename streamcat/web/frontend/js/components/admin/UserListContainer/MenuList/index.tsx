import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useStreamCatNotifications } from 'Components/shared/Notification';
import * as style from './style.scss';
import { NavigationType } from 'Model/Navigation/NavigationModel';
import { ProjectType } from 'Model/Library';
import { Api } from 'Api';
import {FlatButton, TextField} from 'Shared/Input';
import ModalUtil from 'Utils/ModalUtil';
import Constants from 'Constants/index';
import { Spacer } from 'Components/shared/Base';

interface Props {
    navigation: NavigationType | null;
    allProjects: ProjectType[];
    onSuccess: () => void;
}

export const MenuList = (props: Props) => {
    const {navigation, allProjects, onSuccess} = props;

    // 通知機能メソッドの取得
    const {notifyError} = useStreamCatNotifications();

    const [newUserName, setNewUserName] = useState<string | null>(null);
    const [newUserEmail, setNewUserEmail] = useState<string | null>(null);
    const [joinProjects, setJoinProjects] = useState<ProjectType[]>([]);

    useEffect(()=>{
        if (newUserName === null || newUserEmail === null) return;
        ModalUtil.registerModal({
            id: Constants.modal.ADD_USER, onClickDone: () => {
                if(!newUserName.length){
                    alert('名前を入力してください')
                    return
                }
                if(!newUserEmail.length){
                    alert('E-mailを入力してください')
                    return
                }
                createNewUser(newUserName,newUserEmail, joinProjects).then(user => {
                    onSuccess();
                    if(!user){
                        notifyError('ユーザー作成エラー');
                        ModalUtil.closeModal(Constants.modal.ADD_USER)
                        clearField();
                        return
                    }
                    ModalUtil.closeModal(Constants.modal.ADD_USER)
                    const projectDiv = (joinProjects.length > 0)?
                        <div>所属: {joinProjects.map(project => `${project.label}`).join(', ')}</div>:
                        <></>;
                    ModalUtil.emitModal({
                        id: Constants.modal.ADD_USER_CONFIRM,
                        visible: true,
                        done: '閉じる',
                        content: <div className={style.modal}>
                            <form>
                                <div className={style.addUserLabel}>
                                    新規ユーザーの仮登録が完了しました。
                                </div>
                                <Spacer height={20}/>
                                <div className={style.addUserDetails}>
                                    <div>名前: {user.name}</div>
                                    <div>Email: {user.email}</div>
                                    {projectDiv}
                                    <div>仮パスワード: {user.password}</div>
                                </div>
                            </form>
                            <div className={'mt-8px'}/>
                        </div>
                    });
                    clearField();
                }).catch(() => {
                    ModalUtil.closeModal(Constants.modal.ADD_USER)
                })
            }, onClickCancel: ()=>{
                clearField();
            }
        })
    },[newUserEmail, newUserName, joinProjects]);

    // ユーザを新規に作成する
    const createNewUser = async (name: string, email: string, projects: ProjectType[]) => {
        return Api.createUser(email, name).then(user => {
            // UserをProjectに参加させる
            joinProject(user.uuid, projects);
            return user;
        }).catch(e => {
            notifyError('ユーザー作成エラー', e.message);
        });
    };

    // ユーザをプロジェクトに紐付ける
    const joinProject = (userUUID: string, projects: ProjectType[]) => {
        Promise.all(
            projects.map(project => {
                return project.joinMember({uuid:userUUID, type:'Reader'}).catch(e => {
                    notifyError('プロジェクト追加エラー', e.message);
                });
            })
        );
    };

    const clearField = () =>{
        setNewUserName('');
        setNewUserEmail('');
        setJoinProjects([]);
    };

    const onClickNewUser = () => {
        // モーダル表示
        clearField();
        ModalUtil.emitModal({
            id: Constants.modal.ADD_USER,
            visible: true,
            done: '作成する',
            content: <div className={style.modal}>
                <form>
                    <div className={style.label}>
                        名前
                    </div>
                    <div className={style.textField}>
                        <TextField onChange={(e) => setNewUserName(e.target.value)}/>
                    </div>
                    <Spacer height={9}/>
                    <div className={style.label}>
                        E-mail
                    </div>
                    <div className={style.textField}>
                        <TextField onChange={(e) => setNewUserEmail(e.target.value)}/>
                    </div>
                    <Spacer height={14}/>
                    <div className={style.label}>
                        所属プロジェクト
                    </div>
                    <div className={style.select}>
                        <Select
                            onChange={selectedOptions =>
                                setJoinProjects(
                                    selectedOptions.map(option => 
                                        allProjects.find(project => project.uuid===option.value) || null
                                    ).filter(option =>
                                        option!==null
                                    ) as ProjectType[]
                                )
                            }
                            options={allProjects.map(project => ({
                                label: project.label,
                                value: project.uuid
                            }))}
                            placeholder={''}
                            isMulti={true}
                            isSearchable={false}
                            noOptionsMessage={_=>'選択できるプロジェクトがありません'}
                        />
                    </div>
                </form>
                <div className={'mt-8px'}/>
            </div>
        });
    };

    return <>{
        navigation && navigation.allowlist && navigation.allowlist.createUser ?
        <div className={style.menuList}>
            <FlatButton icon={'icon-add'} onClick={onClickNewUser}>ユーザーの新規作成</FlatButton>
        </div> :
        <>{/* // ユーザ作成権限がない場合は、メニューを表示しない */}</>
    }</>;  
};

