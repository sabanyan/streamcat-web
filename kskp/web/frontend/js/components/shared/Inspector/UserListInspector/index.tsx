import React, {useEffect, useState} from 'react'
import style from '../style.scss'
import {BaseInspector, Resizer} from 'Shared/Inspector'
import {UserListUser} from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import {Button, DownloadButton} from 'Shared/Input'
import {APIUtil, ModalUtil, ReactDomUtil} from 'Utils/index';
import {LibraryChild} from 'Model/index';
import AdminUtil from 'Utils/AdminUtil';
import {useDispatch} from 'react-redux';
import {addNotification, removeNotification} from 'reapop';
import ErrorUtil from 'Utils/ErrorUtil';
import {Spacer} from 'Shared/Base';
import {Props as NavigationModelProps} from 'Model/Navigation/NavigationModel';
import WebUtil from 'Utils/WebUtil';

interface Props {
    selected: UserListUser[];
    lastSelected?: UserListUser;
    onClickDelete?: Function;
    onBlurTitle?: Function;
    onClickEdit?: Function;
    onClickPasswordReset?: Function;
    onClickShowPassword?: Function;
    onChangedUserSystemAdminRole?: Function;
    notify: Function;
    navigation?: NavigationModelProps
}

const display = {
    email: 'E-mail',
    projects: '所属プロジェクト',
    state: 'ステータス',
    admin_types: 'KSKP 管理権限',
    admin_types_system_admin: 'システム管理権限',
    admin_types_user_admin: 'ユーザー管理権限',
    password: '仮パスワード',
}


const UserListInspector = (props: Props) => {
    const {notify, navigation} = props;
    const {selected, lastSelected, onBlurTitle} = props
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [systemAdminChecked, setSystemAdminChecked] = useState<boolean>(false)
    const [userAdminChecked, setUserAdminChecked] = useState<boolean>(false)

    useEffect(() => {
        console.log(lastSelected)
        console.log(AdminUtil.hasSystemAdmin(lastSelected.roles))
        console.log(AdminUtil.hasUserAdmin(lastSelected.roles))
        setSystemAdminChecked(AdminUtil.hasSystemAdmin(lastSelected.roles))
        setUserAdminChecked(AdminUtil.hasUserAdmin(lastSelected.roles))
    }, [lastSelected])

    useEffect(()=>{
        // 権限更新確認ダイアログ
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM_UPDATE_KSKP_SYSTEM_ADMIN, onClickDone: () => {
                activateSystemAdminRole(lastSelected.uuid,systemAdminChecked)
                ModalUtil.closeModal(Constants.modal.CONFIRM_UPDATE_KSKP_SYSTEM_ADMIN)
            },onClickCancel: ()=>{
                setSystemAdminChecked(!systemAdminChecked);
                ModalUtil.closeModal(Constants.modal.CONFIRM_UPDATE_KSKP_SYSTEM_ADMIN)
            },onClickClose: ()=>{
                setSystemAdminChecked(!systemAdminChecked);
                ModalUtil.closeModal(Constants.modal.CONFIRM_UPDATE_KSKP_SYSTEM_ADMIN)
            }
        })
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM_UPDATE_KSKP_USER_ADMIN, onClickDone: () => {
                activateUserAdminRole(lastSelected.uuid,userAdminChecked)
                ModalUtil.closeModal(Constants.modal.CONFIRM_UPDATE_KSKP_USER_ADMIN)
            },onClickCancel: ()=>{
                setUserAdminChecked(!userAdminChecked);
                ModalUtil.closeModal(Constants.modal.CONFIRM_UPDATE_KSKP_USER_ADMIN)
            },onClickClose: ()=>{
                setSystemAdminChecked(!userAdminChecked);
                ModalUtil.closeModal(Constants.modal.CONFIRM_UPDATE_KSKP_USER_ADMIN)
            }
        })
        // 自分のユーザー管理権限を剥奪する場合
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM_REMOVE_MY_USER_ADMIN, onClickDone: () => {
                activateUserAdminRole(lastSelected.uuid,false).then(()=>{
                    WebUtil.logout();
                })
                ModalUtil.closeModal(Constants.modal.CONFIRM_REMOVE_MY_USER_ADMIN)
            },onClickCancel: ()=>{
                setUserAdminChecked(true);
                ModalUtil.closeModal(Constants.modal.CONFIRM_REMOVE_MY_USER_ADMIN)
            },onClickClose: ()=>{
                setUserAdminChecked(true);
                ModalUtil.closeModal(Constants.modal.CONFIRM_REMOVE_MY_USER_ADMIN)
            }
        })
    }, [lastSelected,systemAdminChecked,userAdminChecked])

    // システム権限を更新する
    const _activateAdminRole = (role:string, uuid: string,active: boolean) =>{
        let url;
        switch (role){
            case Constants.admin.systemRole.USR_ADMIN:
                url = 'roles/usr_admin/users/' + uuid;
                break;
            case Constants.admin.systemRole.SYS_ADMIN:
                url = 'roles/sys_admin/users/' + uuid;
                break;
            default:
                break;
        }
        if (!url)return;
        const {onChangedUserSystemAdminRole} = props;
        if(active){
            return APIUtil.put(url).then((response)=>{
                if(response.data.success){
                    if(onChangedUserSystemAdminRole)onChangedUserSystemAdminRole()
                }else {
                    notify({
                        title: 'システム権限更新エラー',
                        message: ReactDomUtil.renderToString(response.data.message),
                        status: 'error',
                        dismissAfter: 0,
                        closeButton: true
                    })
                }
            }).catch((error) => {
                notify({
                    title: 'システム権限更新エラー',
                    message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                    status: 'error',
                    dismissAfter: 0,
                    closeButton: true
                })
            });
        }else{
            return APIUtil.delete(url).then((response)=>{
                if(response.data.success){
                    if(onChangedUserSystemAdminRole)onChangedUserSystemAdminRole()
                }else {
                    notify({
                        title: 'システム権限更新エラー',
                        message: ReactDomUtil.renderToString(response.data.message),
                        status: 'error',
                        dismissAfter: 0,
                        closeButton: true
                    })
                }
            }).catch((error) => {
                notify({
                    title: 'システム権限更新エラー',
                    message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                    status: 'error',
                    dismissAfter: 0,
                    closeButton: true
                })
            });
        }
    }

    const activateSystemAdminRole = (uuid: string,active: boolean) =>{
        return _activateAdminRole(Constants.admin.systemRole.SYS_ADMIN,uuid,active);
    }
    const activateUserAdminRole = (uuid: string,active: boolean) =>{
        return _activateAdminRole(Constants.admin.systemRole.USR_ADMIN,uuid,active);
    }

    const renderButtons = (data?: UserListUser) => {
        const {selected, onClickDelete} = props

        let del

        const availableDelete = ([...selected].findIndex((user)=>{
            return (user.state !== Constants.admin.userStatus.inactive)
        }) !== -1);

        // 複数選択の場合
        if (selected.length >= 1) {
            if (onClickDelete && availableDelete) del = <Button danger={true} onClick={() => onClickDelete(data)} icon={'delete'}>削除する</Button>
        }
        return <React.Fragment>
            {del}
        </React.Fragment>
    }

    const onChangeSystemAdmin = (e:React.ChangeEvent<HTMLInputElement>)=>{
        const {lastSelected} = props;
        if(e.target.value === Constants.admin.systemRole.SYS_ADMIN){
            setSystemAdminChecked(e.target.checked);
            // システム管理者がチェックされていた場合
            ModalUtil.emitModal({
                id: Constants.modal.CONFIRM_UPDATE_KSKP_SYSTEM_ADMIN,
                visible: true,
                done: (e.target.checked)?"付与する":"外す",
                danger: (!e.target.checked),
                content: <div className={style.modal}>
                    <form>
                        <div>
                            {
                                (e.target.checked)?
                                    <div>システム管理権限を付与してもよろしいですか</div>
                                    :
                                    <div>システム管理権限を外してもよろしいですか</div>
                            }
                        </div>
                    </form>
                    <div className={'mt-8px'}/>
                </div>
            });
        }else if(e.target.value === Constants.admin.systemRole.USR_ADMIN){
            // ユーザー管理者がチェックされていた場合
            setUserAdminChecked(e.target.checked);
            const isMe = (navigation && navigation.user.uuid === lastSelected.uuid)
            const needLogout = isMe && !e.target.checked
            if(needLogout){
                ModalUtil.emitModal({
                    id: Constants.modal.CONFIRM_REMOVE_MY_USER_ADMIN,
                    visible: true,
                    done: "外す",
                    danger: true,
                    content: <div className={style.modal}>
                        <form>
                            <div>
                                自身のユーザー管理権限を外すと、ユーザー管理機能が利用できなくなります。
                                ユーザー管理権限を外す場合、直ちにログアウトされますがよろしいですか？
                            </div>
                        </form>
                        <div className={'mt-8px'}/>
                    </div>
                });
            }else{
                ModalUtil.emitModal({
                    id: Constants.modal.CONFIRM_UPDATE_KSKP_USER_ADMIN,
                    visible: true,
                    done: (e.target.checked)?"付与する":"外す",
                    danger: (!e.target.checked),
                    content: <div className={style.modal}>
                        <form>
                            <div>
                                {
                                    (e.target.checked)?
                                        <div>ユーザー管理権限を付与してもよろしいですか</div>
                                        :
                                        <div>ユーザー管理権限を外してもよろしいですか</div>
                                }
                            </div>
                        </form>
                        <div className={'mt-8px'}/>
                    </div>
                });
            }

        }
    }


    const renderDetail = (data?: UserListUser) => {
        let result: any = []

        if (!data) return result

        if (data.email) {
            let label = <React.Fragment key={"email"}>
                <div><label>{display.email}</label></div>
                <div className={'mb-8px'}>{data.email}</div>
            </React.Fragment>
            result.push(label)
        }

        if (data.projects) {
            let projects = data.projects.map((project) => {
                return <div key={project.uuid} className={style.project}>{project.label}</div>
            })
            const projectElements = <React.Fragment key={"projects"}>
                <div><label>{display.projects}({data.projects.length})</label></div>
                <div className={'mb-8px'}>{projects}</div>
            </React.Fragment>

            result.push(projectElements)
        }

        if (data.state) {
            let state = <React.Fragment key={"state"}>
                <div><label>{display.state}</label></div>
                <div className={'mb-8px'}>{AdminUtil.getUserStatus(data.state)}</div>
            </React.Fragment>
            result.push(state)

            const {onClickShowPassword} = props;
            if (data.state === Constants.admin.userStatus.tmp && onClickShowPassword) {
                let tempPasswordLabel = <React.Fragment key={"password"}>
                    <div><label>{display.password}</label></div>
                    <div
                        className={'mb-8px'}>{(showPassword) ? data.password : AdminUtil.replaceAsterisk(data.password.length)}</div>
                </React.Fragment>
                result.push(tempPasswordLabel)
                const _onClickShowPassword = () => {
                    setShowPassword(true)
                }
                let showPasswordElement = (!showPassword)?<div key={"showPassword"} className={'mb-8px'}><Button onClick={()=>_onClickShowPassword()}>仮パスワードを表示する</Button></div>:null;
                result.push(showPasswordElement)
            }
            const {onClickPasswordReset} = props;
            if (data.state === 'active' && onClickPasswordReset) {
                let resetPasswordEelement = <div key={"resetPassword"} className={'mb-8px'}><Button danger={true} onClick={()=>{onClickPasswordReset()}}>パスワードリセット</Button></div>
                result.push(resetPasswordEelement)
            }
        }

        if (data.roles){
            result.push(<div key={"adminTypes"}><label>{display.admin_types}</label></div>)
            let systemAdminCheckboxElement = <React.Fragment key={"systemAdminCheckbox"}>
                <div>
                    <label htmlFor={Constants.admin.systemRole.SYS_ADMIN}>
                        <input id={Constants.admin.systemRole.SYS_ADMIN}
                               type="checkbox"
                               checked={systemAdminChecked}
                               onChange={(e) => onChangeSystemAdmin(e)}
                               value={Constants.admin.systemRole.SYS_ADMIN}
                        />
                        &nbsp;
                        {display.admin_types_system_admin}
                    </label>
                </div>
            </React.Fragment>
            result.push(systemAdminCheckboxElement)
            let userAdminCheckboxElement = <React.Fragment key={"userAdminCheckbox"}>
                <div className={'mb-8px'}>
                    <label htmlFor={Constants.admin.systemRole.USR_ADMIN}>
                        <input id={Constants.admin.systemRole.USR_ADMIN}
                               type="checkbox"
                               checked={userAdminChecked}
                               onChange={(e) => onChangeSystemAdmin(e)}
                               value={Constants.admin.systemRole.USR_ADMIN}
                        />
                        &nbsp;
                        {display.admin_types_user_admin}
                    </label>
                </div>
            </React.Fragment>
            result.push(userAdminCheckboxElement)

        }


        return <React.Fragment>
            {result}
        </React.Fragment>
    }

    const renderSelect = (data?: UserListUser) => {
        return <div className={style.inspector}>
            <div className={style.actions}>
                {renderButtons(data)}
            </div>
            <div className={style.full_hr}/>
            <div className={style.detail}>
                {renderDetail(data)}
            </div>
        </div>
    }

    const renderSelects = (selected: UserListUser[], data?: UserListUser) => {
        return <div className={style.inspector}>
            <div className={style.actions}>
                {renderButtons(data)}
            </div>
            <div className={style.detail}>

            </div>
        </div>
    }


    let label = (lastSelected && selected.length <= 1) ? lastSelected.name : undefined
    let content = (selected.length <= 1) ? renderSelect(lastSelected) : renderSelects(selected, lastSelected)

    return <Resizer>
        <BaseInspector key={lastSelected.uuid} label={label} onBlurTitle={onBlurTitle} disabled={true}>
            {content}
        </BaseInspector>
    </Resizer>

}

export default UserListInspector
