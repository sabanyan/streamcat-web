import React from 'react';
import { NavigationType, SelfUserType } from 'Model/Navigation/NavigationModel';
import { EditBox } from 'Shared/Base/EditBox';
import { TextField2 } from 'Shared/Input';

type Props = {
    selfUser: SelfUserType;
    navigation: NavigationType | null;
    onSuccess?:(selfUser:SelfUserType) => void;
};

export const UserBox = (props:Props) => {
    const { selfUser, navigation, onSuccess } = props;

    // 初期表示値
    const initName  = {value:selfUser.name, isError:false};
    const initEmail = {value:selfUser.email, isError:false};
    const initPassword = {value:'', isError:true};

    // テキストボックスの値
    const [name,  setName]  = React.useState(initName);
    const [email, setEmail] = React.useState(initEmail);
    const [password, setPassword] = React.useState(initPassword);
    // 現在パスワードのTextFieldの表示の可否
    const [showPasswd, setShowPasswd] = React.useState(false);

    // 値の初期化処理
    const initValues = () => {
        setName(initName);
        setEmail(initEmail);
        setPassword(initPassword);
    };

    const requiredMessage = '変更するには現在のパスワードが必要です';

    // Userの更新処理
    const update = () => {
        const promises:Promise<SelfUserType>[] = [];
        // 名前が変更された場合はPromiseを追加する
        if(name.value!==selfUser.name){
            promises.push(
                Promise.resolve(selfUser.rename(name.value))
            );
        }
        if(email.value!==selfUser.email){
            if(password.isError){
                return Promise.reject({message:requiredMessage});
            }
            promises.push(
                Promise.resolve(selfUser.updateEMail(email.value, password.value))
            );
        }
        // 全ての更新処理が完了したら、Projectを返すPromiseを返す
        return Promise.all(promises).then(users => users[0]);
    };

    // 現在パスワードのTextFieldを非表示にする
    const hidePasswd = () => {
        setPassword(initPassword);
        setShowPasswd(false);
    };

    return <EditBox<SelfUserType>
        // userオブジェクトはallowlistを持ってないのでreadOnlyで更新可否を設定する
        readOnly={!(navigation && navigation.allowlist && navigation.allowlist.updateSelfUser)}
        createMode={false}
        datum={selfUser}
        values={[name, email, password]}
        initValues={initValues}
        // ダミー処理
        create={() => {
            return Promise.resolve(selfUser)}
        }
        update={update}
        onSuccess={user => {
            hidePasswd();
            onSuccess && onSuccess(user);
        }}
        onCancel={hidePasswd} >{[
        // ボタン
        () => [],
        // テキストボックス
        (readOnly, onErrorChange, onEnterKeyDown) => [
            <TextField2 key='name'
                        label='名前'
                        required={true}
                        readOnly={readOnly}
                        state={[name,setName]}
                        onErrorChange={onErrorChange}
                        onEnterKeyDown={onEnterKeyDown} />,
            <TextField2 key='email'
                        label='E-mail'
                        required={true}
                        readOnly={readOnly}
                        state={[email,setEmail]}
                        // E-Mailが変更されたら現在のパスワードの入力を要求する
                        onChange={email => setShowPasswd(email.value!==initEmail.value)}
                        onErrorChange={onErrorChange}
                        onEnterKeyDown={onEnterKeyDown} />,
            // E-Mailが変更されたら現在のパスワードを表示する
            showPasswd? <TextField2 key='pass'
                                    label='現在のパスワード'
                                    type='password'
                                    required={true}
                                    requiredMessage={requiredMessage}
                                    readOnly={readOnly}
                                    autoComplete='current-password'
                                    state={[password,setPassword]}
                                    onErrorChange={onErrorChange}
                                    onEnterKeyDown={onEnterKeyDown} />:
                        <React.Fragment key='none'></React.Fragment>
        ]
    ]}</EditBox>;
};
