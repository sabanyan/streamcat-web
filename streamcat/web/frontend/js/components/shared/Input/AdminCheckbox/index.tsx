import React from 'react';
import AdminUtil from 'Utils/AdminUtil';
import { useStreamCatNotifications } from 'Shared/Notification';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';
import { AwaitButton, Button2 } from 'Shared/Input';
import { DialogCheckbox } from 'Shared/Input/DialogCheckbox';

type Props = {
    navigation: NavigationType | null;
    whichAdmin: 'sys'|'usr';
    user: UserType;
    onSuccess: (newUser:UserType) => void;
};

export const AdminCheckbox = (props:Props) => {
    const {navigation, whichAdmin, user, onSuccess} = props;

    // 通知ダイアログ
    const {notifyError} = useStreamCatNotifications();

    // TODO: 管理権限を変更するWebAPIが変更後の値を返さないので、このコンポーネント内で値を保持する
    const [adminRole, setAdminRole] = React.useState({
        value:  whichAdmin==='sys'?
                AdminUtil.hasSystemAdmin(user.roles||[]):
                AdminUtil.hasUserAdmin(user.roles||[]),
        isError: false
    });

    // Checkboxの値
    const checked = adminRole.value;

    // 管理権限の名称
    const adminRoleName = whichAdmin==='sys'? 'システム管理権限': 'ユーザー管理権限';

    // 自分自身が操作対象ユーザの場合はTrue
    const isMe = navigation && navigation.user.uuid===user.uuid;
    // 自分自身のユーザ管理権限を外す場合はTrue
    const needLogout = whichAdmin==='usr' && isMe && checked;

    // ダイアログメッセージ
    let dialogMessage:string;
    if(needLogout){
        dialogMessage = '自身のユーザー管理権限を外すと、このユーザー管理画面が利用できなくなります。' +
                        'よろしいですか？';
    }else{
        dialogMessage = `${adminRoleName}を${checked? '外': '付与'}してもよろしいですか?`;
    }

    // 削除状態の場合は管理権限を変更させない
    const readonly = user.state === 'inactive';

    return <DialogCheckbox label={adminRoleName}
                            dialogTitle={dialogMessage}
                            readOnly={readonly}
                            // Checkboxの値はこのコンポーネントで管理するのでsetAdminRoleは渡さない
                            state={[adminRole,()=>{}]}>{[
        // Contents
        ()=>[],
        // Buttons
        (closeDialog, value) => [
            <Button2 key='cancel'
                     onClick={closeDialog}>キャンセル</Button2>,
            <AwaitButton key='adminRole'
                         onClick={() => {
                            // ダイアログを閉じる
                            // FIXME: 閉じる瞬間に変更後のダイアログメッセージが見えてしまう
                            //        (例：付与しても.. => 外しても..)
                            closeDialog();
                            // 管理権限の種別とチェック状態で実行する処理を選択する
                            let promise: Promise<void>;
                            if(whichAdmin==='sys'){
                                if(value.value){
                                    promise = user.leaveSysAdminRole();
                                }else{
                                    promise = user.joinSysAdminRole();
                                }
                            }else{
                                if(value.value){
                                    promise = user.leaveUsrAdminRole();
                                }else{
                                    promise = user.joinUsrAdminRole();
                                }
                            }
                            // 管理権限を変更する
                            return promise.then(() => {
                                // Checkboxの値をトグルする
                                setAdminRole({value:!value.value, isError:false});
                                onSuccess(user);
                            }).catch(e => {
                                notifyError('システム権限更新エラー', e.message);
                            });;
                        }}>{checked? '外す': '付与する'}</AwaitButton>
        ]
    ]}</DialogCheckbox>;
};
