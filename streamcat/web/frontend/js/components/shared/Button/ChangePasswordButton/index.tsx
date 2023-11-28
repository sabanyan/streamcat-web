import React from 'react';
import { NavigationType, SelfUserType } from 'Model/Navigation/NavigationModel';
import { EditBox } from 'Shared/Base/EditBox';
import { DialogButton, TextField2 } from 'Shared/Input';

type Props = {
    selfUser: SelfUserType;
    navigation: NavigationType | null;
    onSuccess?:(selfUser:SelfUserType) => void;
};

export const ChangePasswordButton = (props:Props) => {
    const { selfUser, navigation, onSuccess } = props;

    // 初期表示値
    const initPassword = {value:'', isError:true};

    // テキストボックスの値
    const [password, setPassword] = React.useState(initPassword);
    const [newPassword, setNewPassword] = React.useState(initPassword);

    // 値の初期化処理
    const initValues = () => {
        setPassword(initPassword);
        setNewPassword(initPassword);
    };

    // userオブジェクトはallowlistを持ってないのでreadOnlyで更新可否を設定する
    const enabled = navigation && navigation.allowlist && navigation.allowlist.updateSelfUser;

    const validatePassword = (pass:string) => {
        if(pass.length < 10){
            return '10桁以上のパスワードが必要です';
        }else if(64 < pass.length){
            return '64桁以下のパスワードが必要です';
        }else if(/[^!-~]/.test(pass)){
            return '利用できる文字は、英数字と記号 !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~ のみです';
        }else{
            return true;
        }
    };

    // NOTE: EditBoxのonErrorChange()は各入力コンポーネントのエラー状態は1つずつ増減する前提である
    // そのため確認用パスワードの入力を求める方式は、パスワードが一致していなくても確定ボタンが押下可能な場合が発生した
    return <DialogButton label='パスワードの変更'
                         readOnly={!enabled} >{[
        // Contents
        (closeDialog) => [
            <EditBox<SelfUserType>
                key='changePasswd'
                createMode={true}
                datum={selfUser}
                values={[password, newPassword]}
                initValues={initValues}
                // パスワードの更新処理
                create={() => 
                    selfUser.updatePassword(newPassword.value, password.value)
                }
                onSuccess={user => {
                    onSuccess && onSuccess(user);
                    closeDialog();
                }}
                onCancel={closeDialog} >{[
                // ボタン
                () => [],
                // テキストボックス
                (readOnly, onErrorChange, onEnterKeyDown) => [
                    <TextField2 key='pass'
                                label='現在のパスワード'
                                type='password'
                                readOnly={readOnly}
                                required={true}
                                requiredMessage='変更するには現在のパスワードが必要です'
                                autoComplete='current-password'
                                state={[password,setPassword]}
                                onErrorChange={onErrorChange}
                                onEnterKeyDown={onEnterKeyDown} />,
                    <TextField2 key='newPass1'
                                label='新しいパスワード'
                                type='password'
                                readOnly={readOnly}
                                required={true}
                                autoComplete='new-password'
                                state={[newPassword,setNewPassword]}
                                validate={validatePassword}
                                onErrorChange={onErrorChange}
                                onEnterKeyDown={onEnterKeyDown} />
                ]
            ]}</EditBox>
        ],
        // Buttons
        ()=>[]
    ]}</DialogButton>;
};
