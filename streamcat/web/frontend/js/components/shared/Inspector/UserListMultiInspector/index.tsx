import React from 'react'
import style from '../style.scss'
import {BaseInspector, Resizer} from 'Shared/Inspector'
import Constants from 'Constants/index'
import {Button} from 'Shared/Input'
import { UserType2 } from 'Components/admin/UserListContainer/UserList2'

interface Props {
    selectedDatas: UserType2[];
    onClickDelete?: () => void;
}

const UserListMultiInspector = (props: Props) => {
    const {selectedDatas} = props

    const renderButtons = () => {
        const {selectedDatas, onClickDelete} = props

        let del

        const availableDelete = ([...selectedDatas].findIndex((user)=>{
            return (user.state !== Constants.admin.userStatus.inactive)
        }) !== -1);

        // 複数選択の場合
        if (selectedDatas.length >= 1) {
            if (onClickDelete && availableDelete) del = <Button danger={true} onClick={() => onClickDelete()} icon={'delete'}>削除する</Button>
        }
        return <React.Fragment>
            {del}
        </React.Fragment>
    }

    return <Resizer>
        <BaseInspector key={JSON.stringify(selectedDatas)} label={""} disabled={true}>
            <div className={style.inspector}>
                <div className={style.actions}>
                    {renderButtons()}
                </div>
                <div className={style.detail}>

                </div>
            </div>
        </BaseInspector>
    </Resizer>

}

export default UserListMultiInspector
