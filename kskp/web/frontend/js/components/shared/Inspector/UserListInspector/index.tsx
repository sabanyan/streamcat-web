import React, {useState} from 'react'
import style from '../style.scss'
import {BaseInspector, Resizer} from 'Shared/Inspector'
import {UserListUser} from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import {Button, DownloadButton} from 'Shared/Input'
import {APIUtil, ModalUtil, StringUtil} from 'Utils/index';
import {LibraryChild} from 'Model/index';
import AdminUtil from 'Utils/AdminUtil';

interface Props {
    selected: UserListUser[];
    lastSelected?: UserListUser;
    onClickDelete?: Function;
    onBlurTitle?: Function;
    onClickEdit?: Function;
    onClickPasswordReset?: Function;
}

const display = {
    email: 'E-mail',
    projects: '所属プロジェクト',
    status: 'ステータス',
    admin_types: 'KSKP 管理権限',
    password: '仮パスワード',
}


const UserListInspector = (props: Props) => {


    const onClickEdit = (e) => {
        const {lastSelected, onClickEdit} = props
        if (onClickEdit) onClickEdit(lastSelected)
    }

    const renderButtons = (data?: UserListUser) => {
        const {selected, onClickDelete} = props

        let del

        // 複数選択の場合
        if (selected.length >= 1) {
            // delete button
            if (onClickDelete) del =
                <Button danger={true} onClick={() => onClickDelete(data)} icon={'delete'}>削除する</Button>
        }
        return <React.Fragment>
            {del}
        </React.Fragment>
    }

    const renderDetail = (data?: UserListUser) => {
        let result: any = []

        const [showPassword, setShowPassword] = useState<Boolean>(false)
        console.log('renderDetail', data);
        if (!data) return result

        if (data.email) {
            let label = <React.Fragment>
                <div><label>{display.email}</label></div>
                <div className={'mb-8px'}>{data.email}</div>
            </React.Fragment>
            result.push(label)
        }

        if (data.projects) {
            let projects = data.projects.map((project) => {
                return <div className={style.project}>{project.label}</div>
            })
            const projectElements = <React.Fragment>
                <div><label>{display.projects}({data.projects.length})</label></div>
                <div className={'mb-8px'}>{projects}</div>
            </React.Fragment>

            result.push(projectElements)
        }

        if (data.status) {
            let status = <React.Fragment>
                <div><label>{display.status}</label></div>
                <div className={'mb-8px'}>{AdminUtil.getUserStatus(data.status)}</div>
            </React.Fragment>
            result.push(status)

            if (data.status === 'tmp') {
                const onClickShowPassword = () => {
                    setShowPassword(true)
                }
                let showPasswordElement = (!showPassword)?<Button onClick={onClickShowPassword}>仮パスワードの表示</Button>:null;
                result.push(showPasswordElement)

                let tempPasswordLabel = <React.Fragment>
                    <div><label>{display.password}</label></div>
                    <div
                        className={'mb-8px'}>{(showPassword) ? data.password : AdminUtil.replaceAsterisk(data.password.length)}</div>
                </React.Fragment>
                result.push(tempPasswordLabel)
            }
            const {onClickPasswordReset} = props;
            if (data.status === 'active' && onClickPasswordReset) {
                let resetPasswordEelement = <Button danger={true} onClick={()=>{onClickPasswordReset()}}>パスワードリセット</Button>
                result.push(resetPasswordEelement)
            }
        }


        return <React.Fragment>
            {result}
        </React.Fragment>
    }

    const renderSelect = (data?: UserListUser) => {
        let content: any = <div className={style.inspector}>
            <div className={style.actions}>
                {renderButtons(data)}
            </div>
            <div className={style.full_hr}/>
            <div className={style.detail}>
                {renderDetail(data)}
            </div>
        </div>

        console.log('renderSelect')
        return content
    }

    const renderSelects = (selected: UserListUser[], data?: UserListUser) => {
        let content = <div className={style.inspector}>
            <div className={style.actions}>
                {renderButtons(data)}
            </div>
            <div className={style.detail}>

            </div>
        </div>
        console.log('renderSelects')

        return content
    }


    const {selected, lastSelected, onBlurTitle} = props
    let label = (lastSelected && selected.length <= 1) ? lastSelected.name : undefined
    console.log(selected.length)
    console.log(lastSelected)
    let content = (selected.length <= 1) ? renderSelect(lastSelected) : renderSelects(selected, lastSelected)

    return <Resizer>
        <BaseInspector label={label} onBlurTitle={onBlurTitle} disabled={true}>
            {content}
        </BaseInspector>
    </Resizer>

}

export default UserListInspector
