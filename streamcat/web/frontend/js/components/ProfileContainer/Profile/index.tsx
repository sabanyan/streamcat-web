import React, {useEffect, useState} from 'react'
import style from './style.scss'
import {APIUtil, ReactDomUtil, ErrorUtil} from 'Utils/index'
import {ModalManager} from 'Shared/Modal'
import {Loader} from 'Shared/Base'
import {Button, LinkButton, TextField} from 'Shared/Input'
import {NotificationManager, useStreamCatNotifications} from 'Shared/Notification';
import {useForm, UseFormRegisterReturn} from 'react-hook-form';
import {NavigationType} from 'Model/Navigation/NavigationModel';

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */
interface Props {
    navigation: NavigationType | null;
}

interface Profile {
    name: string,
    email: string
}

interface FormInputs {
    name: string,
    email: string,
    currentPassword: string,
    password1: string,
    password2: string
}

type EditingMode = ('name' | 'email' | 'password' | null);

/**
 * React-Hook-Form v7でMaterial-UI v4のTextFieldがバインドできない問題の対処をする
 * https://dev.classmethod.jp/articles/mui-with-rhf-v7/
 */
const registerMui = (res: UseFormRegisterReturn) => ({
    inputRef: res.ref,
    onChange: res.onChange,
    onBlur: res.onBlur,
    name: res.name,
});

const Profile = (props: Props) => {

    // 通知機能メソッドの取得
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    const {navigation} = props;
    const availableUpdateSelf = (navigation && navigation.allowlist && navigation.allowlist.updateSelfUser)

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [profile, setProfile] = useState<Profile | null>({
        name: '',
        email: ''
    });
    const {handleSubmit, register, formState:{errors}, watch, clearErrors, reset} = useForm<FormInputs | any>({
        shouldUnregister: false
    });
    const [editing, setEditing] = useState<EditingMode>(null);

    useEffect(() => {
        getProfile()
    }, []);

    useEffect(() => {
        //編集モードが切り替わる都度、validation エラーをクリアする
        clearErrors()
    }, [editing]);

    useEffect(() => {
        if (profile) {
            // プロフィールを取得した際にデフォルト値のプロフィールを設定する
            // reset の引数を設定することで、テキストフィールドの defaultValue を設定できる
            const resetValue = {
                'name': profile.name,
                'email': profile.email
            };
            reset(resetValue);
        }
    }, [profile]);

    // プロフィールの取得
    const getProfile = () => {
        setIsLoading(true)
        // user_idはナビゲーションモデルから取得できない
        // APIをたたかないと取得できないため、injectされたuser_idを使う
        APIUtil.get('users/self').then((response) => {
            const json = response.data
            setIsLoading(true);
            setIsFinished(true);
            setProfile(json.data);
        }).catch((error) => {
            notifyError('プロフィールの取得エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)));
            setIsLoading(false);
            setIsFinished(true);
        })
    }

    const onSubmit = (data) => {
        const formState = data;
        setIsLoading(true);
        let body;
        switch (editing) {
            case 'name':
                body = {
                    name: formState['name']
                }
                break;
            case 'email':
                body = {
                    email: formState['email'],
                    currentPassword: formState['currentPassword'],
                }
                break;
            case 'password':
                body = {
                    currentPassword: formState['currentPassword'],
                    password: formState['password1'],
                }
        }
        APIUtil.put('users/self', body).then((response) => {
            const json = response.data
            setIsLoading(false)
            if (!json.success) {
                ErrorUtil.notifyError(notifyError, 'ユーザー情報更新エラー', json.message);
                return
            }
            notifySuccess('ユーザー情報を更新しました');
            getProfile();
            setEditing(null);
        }).catch((error) => {
            ErrorUtil.notifyError(notifyError, 'ユーザー情報更新エラー', error);
            setIsLoading(false)
        });
    }

    // 編集モードの切り替え
    const switchEditing = (mode: EditingMode) => {
        reset();// 値を初期値に戻して編集モードを設定する
        setEditing(mode);
    };

    if (!isFinished || !profile) return <div className={'container mt-40px'}>
        <Loader center={true} absolute={true} visible={isLoading}/>
    </div>

    return <div className={'container mt-40px'}>
        <div className={style.page_title}>
            ユーザー情報変更
        </div>
        <div className={style.property_body}>
            <div className={style.card}>
                <form onSubmit={(availableUpdateSelf)?handleSubmit(onSubmit):undefined} className={'mb-32px'}>
                    <div className={'mb-8px'}>
                        {
                            (availableUpdateSelf) ?
                                (editing === 'name') ?
                                    <label>ユーザー名 <LinkButton
                                        onClick={() => switchEditing(null)}>キャンセル</LinkButton></label>
                                    :
                                    <label>ユーザー名 <LinkButton
                                        onClick={() => switchEditing('name')}>変更する</LinkButton></label>
                                :  <label>ユーザー名</label>
                        }
                        <TextField readOnly={(editing !== 'name')} placeholder={'ユーザ名'}
                                   {...registerMui(register('name', {required:'ユーザー名を入力してください'}))}/>
                        {errors.name && <label className={'text-danger'}>{errors.name.message}</label>}
                    </div>
                    {
                        (editing === 'name') ?
                            <div className={'text-right'}>
                                <Button disabled={!availableUpdateSelf} submit={true} className={'mr-0'}>保存する</Button>
                            </div>
                            :
                            null
                    }
                </form>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={'mb-8px'}>
                        {
                            (availableUpdateSelf) ?
                                (editing === 'email') ?
                                    <label>メールアドレス <LinkButton
                                        onClick={() => switchEditing(null)}>キャンセル</LinkButton></label>
                                    :
                                    <label>メールアドレス <LinkButton
                                        onClick={() => switchEditing('email')}>変更する</LinkButton></label>
                                : <label>メールアドレス</label>
                        }
                        <TextField readOnly={(editing !== 'email')} placeholder={'メールアドレス'} type={'email'}
                                   {...registerMui(register('email', {required: 'E-mail を入力してください'}))}/>
                        {errors.email && <label className={'text-danger'}>{errors.email.message}</label>}
                    </div>
                    {
                        (editing === 'email') ?
                            <>
                                <div className={'mb-8px'}>
                                    <label>現在のパスワード</label>
                                    <TextField placeholder={'現在のパスワード'} type={'password'}
                                               {...registerMui(register('currentPassword'))}/>
                                </div>
                                <div className={'text-right'}>
                                    <Button disabled={!availableUpdateSelf} submit={true} className={'mr-0'}>保存する</Button>
                                </div>
                            </>
                            : null
                    }
                </form>
                {
                    (availableUpdateSelf) ?
                        <form onSubmit={handleSubmit(onSubmit)} className={'mt-32px'}>
                            {
                                (editing === 'password') ?
                                    <label><LinkButton onClick={() => switchEditing(null)}>キャンセル</LinkButton></label>
                                    :
                                    <label><LinkButton
                                        onClick={() => switchEditing('password')}>現在のパスワードを変更する</LinkButton></label>
                            }

                            {
                                (editing === 'password') ?
                                    <>
                                        <div className={'mb-8px'}>
                                            <label>現在のパスワード</label>
                                            <TextField readOnly={(editing !== 'password')} placeholder={'現在のパスワード'}
                                                       type={'password'}
                                                       {...registerMui(register('currentPassword', {required: '現在のパスワードを入力してください'}))}/>
                                            {errors.currentPassword &&
                                            <label className={'text-danger'}>{errors.currentPassword.message}</label>}
                                        </div>
                                        <div className={'mb-8px'}>
                                            <label>新しいパスワード <span
                                                className={style.helpText}>10桁以上のパスワードが必要</span></label>

                                            <TextField placeholder={'新しいパスワード'} type={'password'}
                                                       {...registerMui(register('password1', {
                                                           required: '新しいパスワードを入力してください',
                                                           minLength: {
                                                               value: 10,
                                                               message: '10桁以上のパスワードが必要です'
                                                           },
                                                           maxLength: {
                                                               value: 64,
                                                               message: '64桁以下のパスワードが必要です'
                                                           },
                                                           pattern: {
                                                               value: /[!-~]/,
                                                               message: 'パスワードで利用できる文字は、英数字と記号 !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~ のみです'
                                                           }
                                                       }))}/>
                                            {errors.password1 &&
                                            <label className={'text-danger'}>{errors.password1.message}</label>}
                                        </div>
                                        <div className={'mb-8px'}>
                                            <label>新しいパスワード（確認用）</label>
                                            <TextField placeholder={'新しいパスワード（確認用）'} type={'password'}
                                                       {...registerMui(register('password2', {
                                                           required: '新しいパスワード（確認用）を入力してください',
                                                           validate: (value) => {
                                                               return value === watch('password1') || '新しいパスワードが新しいパスワード（確認用）と一致していません';
                                                           }
                                                       }))}/>
                                            {errors.password2 &&
                                            <label className={'text-danger'}>{errors.password2.message}</label>}
                                        </div>
                                        <div className={'text-right'}>
                                            <Button disabled={!availableUpdateSelf} submit={true}
                                                    className={'mr-0'}>保存する</Button>
                                        </div>
                                    </>
                                    : null
                            }
                        </form>
                        : null
                }
            </div>
        </div>
        <ModalManager/>
        <NotificationManager/>
    </div>
}
export {Profile}
