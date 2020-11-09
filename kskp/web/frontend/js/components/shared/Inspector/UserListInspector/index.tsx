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
    selectedData?: UserListUser;
    onClickDelete?: Function;
    onBlurTitle?: Function;
    onClickEdit?: Function;
    onClickPasswordReset?: Function;
    onClickShowPassword?: Function;
    onChangedUserSystemAdminRole?: Function;
    onChangedList?: Function;
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
    const {notify, navigation, onChangedList} = props;
    const {selectedData, onBlurTitle} = props
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [systemAdminChecked, setSystemAdminChecked] = useState<boolean>(false)
    const [userAdminChecked, setUserAdminChecked] = useState<boolean>(false)

    useEffect(() => {
        setSystemAdminChecked(AdminUtil.hasSystemAdmin(selectedData.roles))
        setUserAdminChecked(AdminUtil.hasUserAdmin(selectedData.roles))
    }, [selectedData])

    useEffect(()=>{
        // 権限更新確認ダイアログ
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM_UPDATE_KSKP_SYSTEM_ADMIN, onClickDone: () => {
                activateSystemAdminRole(selectedData.uuid,systemAdminChecked).catch(_=>{
                    setSystemAdminChecked(!systemAdminChecked);
                })
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
                activateUserAdminRole(selectedData.uuid,userAdminChecked).catch(_=>{
                    setUserAdminChecked(!userAdminChecked);
                })
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
                activateUserAdminRole(selectedData.uuid,false).then((res)=>{
                    WebUtil.logout();
                }).catch(_=>{
                    setUserAdminChecked(true);
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
        // 削除済みのユーザーをもとに戻す
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM_UNDELETE_USER, onClickDone: async () => {
                await unDeleteUser(selectedData.uuid);
                if(onChangedList)onChangedList();
                ModalUtil.closeModal(Constants.modal.CONFIRM_UNDELETE_USER)
            },onClickCancel: ()=>{
                ModalUtil.closeModal(Constants.modal.CONFIRM_UNDELETE_USER)
            },onClickClose: ()=>{
                ModalUtil.closeModal(Constants.modal.CONFIRM_UNDELETE_USER)
            }
        })
    }, [selectedData,systemAdminChecked,userAdminChecked])

    const unDeleteUser = async (uuid:string)=>{
        const url = 'users/' + uuid + "/undelete";
        return APIUtil.put(url).then((response)=>{
            if(response.data.success){
                return Promise.resolve(response)
            }else {
                notify({
                    title: 'システム権限更新エラー',
                    message: ReactDomUtil.renderToString(response.data.message),
                    status: 'error',
                    dismissAfter: 0,
                    closeButton: true
                })
                return Promise.reject()
            }
        }).catch((error) => {
            notify({
                title: 'ユーザー削除エラー',
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                status: 'error',
                dismissAfter: 0,
                closeButton: true
            })
        });
    }

    // システム権限を更新する
    const _activateAdminRole = async (role:string, uuid: string,active: boolean) =>{
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
            const response = await APIUtil.put(url).catch((error) => {
                notify({
                    title: 'システム権限更新エラー',
                    message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                    status: 'error',
                    dismissAfter: 0,
                    closeButton: true
                })
                return Promise.reject()
            });
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
                return Promise.reject()
            }
            return response;
        }else{
            const response = await APIUtil.delete(url).catch((error) => {
                notify({
                    title: 'システム権限更新エラー',
                    message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                    status: 'error',
                    dismissAfter: 0,
                    closeButton: true
                })
                return Promise.reject()
            });

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
                return Promise.reject()
            }
            return response;
        }
    }

    const activateSystemAdminRole = (uuid: string,active: boolean) =>{
        return _activateAdminRole(Constants.admin.systemRole.SYS_ADMIN,uuid,active);
    }
    const activateUserAdminRole = (uuid: string,active: boolean) =>{
        return _activateAdminRole(Constants.admin.systemRole.USR_ADMIN,uuid,active);
    }

    const renderButtons = (data?: UserListUser) => {
        const {onClickDelete,selectedData} = props
        let del
        const availableDelete = (selectedData.state !== Constants.admin.userStatus.inactive);
        if (onClickDelete && availableDelete) del = <Button danger={true} onClick={() => onClickDelete(data)} icon={'delete'}>削除する</Button>
        return <React.Fragment>
            {del}
        </React.Fragment>
    }

    const onChangeSystemAdmin = (e:React.ChangeEvent<HTMLInputElement>)=>{
        const {selectedData} = props;
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
            const isMe = (navigation && navigation.user.uuid === selectedData.uuid)
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
            if (data.state === 'inactive'){
                const onClickUndelete = ()=>{
                    ModalUtil.emitModal({
                        id: Constants.modal.CONFIRM_UNDELETE_USER,
                        visible: true,
                        done: "利用中に戻す",
                        danger: false,
                        content: <div className={style.modal}>
                            <form>
                                <div>
                                    利用中に戻しますがよろしいですか？
                                </div>
                            </form>
                        </div>
                    });
                }
                let unDeleteElement = <div key={"undelete"} className={'mb-8px'}>
                    <Button danger={false} onClick={()=>{onClickUndelete()}}>利用中に戻す</Button>
                </div>
                result.push(unDeleteElement);
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
    let label = selectedData.name
    let content = renderSelect(selectedData)

    return <Resizer>
        <BaseInspector key={selectedData.uuid} label={label} onBlurTitle={onBlurTitle} disabled={true}>
            {content}
        </BaseInspector>
    </Resizer>

}

export default UserListInspector
