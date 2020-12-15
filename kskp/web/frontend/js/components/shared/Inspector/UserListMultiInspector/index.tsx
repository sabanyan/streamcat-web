import React from 'react'
import style from '../style.scss'
import {BaseInspector, Resizer} from 'Shared/Inspector'
import {UserListUser} from 'Types/index'
import Constants from 'Constants/index'
import {Button} from 'Shared/Input'
import {Props as NavigationModelProps} from 'Model/Navigation/NavigationModel';

interface Props {
    selectedDatas: UserListUser[];
    onClickDelete?: Function;
}

const UserListMultiInspector = (props: Props) => {
    const {selectedDatas} = props

    const renderButtons = (data?: UserListUser) => {
        const {selectedDatas, onClickDelete} = props

        let del

        const availableDelete = ([...selectedDatas].findIndex((user)=>{
            return (user.state !== Constants.admin.userStatus.inactive)
        }) !== -1);

        // 複数選択の場合
        if (selectedDatas.length >= 1) {
            if (onClickDelete && availableDelete) del = <Button danger={true} onClick={() => onClickDelete(data)} icon={'delete'}>削除する</Button>
        }
        return <React.Fragment>
            {del}
        </React.Fragment>
    }

    return <Resizer>
        <BaseInspector key={JSON.stringify(selectedDatas)} label={null} disabled={true}>
            <div className={style.inspector}>
                <div className={style.actions}>
                    {renderButtons(selectedDatas)}
                </div>
                <div className={style.detail}>

                </div>
            </div>
        </BaseInspector>
    </Resizer>

}

export default UserListMultiInspector
