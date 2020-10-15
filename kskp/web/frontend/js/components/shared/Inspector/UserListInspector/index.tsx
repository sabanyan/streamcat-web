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
    const {notify} = props;
    const [showPassword, setShowPassword] = useState<Boolean>(false)

    // useEffect(()=>{
    //     // // パスワードリセットの処理
    //     // ModalUtil.registerModal({
    //     //     id: Constants.modal.CONFIRM_UPDATE_SYSTEM_ADMIN, onClickDone: () => {
    //     //
    //     //     },
    //     // })
    //     // // ユーザ作成後の確認ダイアログ
    //     // ModalUtil.registerModal({
    //     //     id: Constants.modal.ADD_USER_CONFIRM, onClickDone: () => {
    //     //         ModalUtil.closeModal(Constants.modal.ADD_USER_CONFIRM);
    //     //     }
    //     // })
    // }, [])

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
        _activateAdminRole(Constants.admin.systemRole.SYS_ADMIN,uuid,active);
    }
    const activateUserAdminRole = (uuid: string,active: boolean) =>{
        _activateAdminRole(Constants.admin.systemRole.USR_ADMIN,uuid,active);
    }

    const renderButtons = (data?: UserListUser) => {
        const {selected, onClickDelete} = props

        let del

        const availableDelete = ([...selected].findIndex((user)=>{
            console.log(user)
            return (user.state !== Constants.admin.userStatus.inactive)
        }) !== -1);

        console.log(availableDelete)

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
        console.log(lastSelected);
        if(e.target.value === Constants.admin.systemRole.SYS_ADMIN){
            // システム管理者がチェックされていた場合
            activateSystemAdminRole(lastSelected.uuid,e.target.checked)
        }else if(e.target.value === Constants.admin.systemRole.USR_ADMIN){
            // ユーザー管理者がチェックされていた場合
            activateUserAdminRole(lastSelected.uuid,e.target.checked)
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
                               type="checkbox" defaultChecked={AdminUtil.hasSystemAdmin(data.roles)}
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
                               type="checkbox" defaultChecked={AdminUtil.hasUserAdmin(data.roles)}
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


    const {selected, lastSelected, onBlurTitle} = props
    let label = (lastSelected && selected.length <= 1) ? lastSelected.name : undefined
    let content = (selected.length <= 1) ? renderSelect(lastSelected) : renderSelects(selected, lastSelected)

    return <Resizer>
        <BaseInspector key={lastSelected.uuid} label={label} onBlurTitle={onBlurTitle} disabled={true}>
            {content}
        </BaseInspector>
    </Resizer>

}

export default UserListInspector
