import React, {useEffect, useState} from 'react'
import { useAsyncResource } from 'use-async-resource'
import {useForm, UseFormRegisterReturn} from 'react-hook-form';
import style from './style.scss'
import {ModalManager} from 'Shared/Modal'
import {Button, Link2, TextField} from 'Shared/Input'
import {NotificationManager, useStreamCatNotifications} from 'Shared/Notification';
import {NavigationType, SelfUserType} from 'Model/Navigation/NavigationModel';
import { Api, ErrorResponse } from 'Api';

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */
type Props = {
    navigation: NavigationType | null;
}

type Profile = {
    name: string,
    email: string
}

type FormInputs = {
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

export const Profile = (props: Props) => {
    const {navigation} = props;

    // ここでログインUserの取得を開始する
    const [selfUserReader] = useAsyncResource(Api.findSelfUser, []);

    // 通知機能メソッドの取得
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // ログインユーザ
    const [selfUser, setSelfUser] = useState<SelfUserType>(selfUserReader());
    // 編集モード
    const [editing, setEditing] = useState<EditingMode>(null);

    // Formの初期値
    const initFormValue = {
        name: selfUser.name,
        email: selfUser.email,
        currentPassword: '',
        password1: '',
        password2: ''
    };

    // Form
    const {handleSubmit, register, formState:{errors}, watch, clearErrors, reset} = useForm<FormInputs, SelfUserType>({
        // Formの初期表示値
        defaultValues: initFormValue,
        // 
        shouldUnregister: false
    });

    //編集モードが切り替わる都度、validation エラーをクリアする
    useEffect(() => {
        clearErrors()
    }, [editing]);

    const onSubmit = (data) => {
        const formState = data;
        let updatePromise: Promise<SelfUserType>;
        switch (editing) {
            case 'name':
                updatePromise = selfUser?.rename(formState['name']);
                break;
            case 'email':
                updatePromise = selfUser?.updateEMail(formState['email'], formState['currentPassword']);
                break;
            case 'password':
                updatePromise = selfUser?.updatePassword(formState['password1'], formState['currentPassword']);
                break;
            default:
                throw new Error('invalid editing mode');
        }

        updatePromise.then(user => {
            notifySuccess('ユーザー情報を更新しました');
            setSelfUser(user);
            setEditing(null);
        }).catch((e:ErrorResponse) => {
            notifyError('ユーザー情報更新エラー', e.message);
        });

    };

    const onClickUpdate = (mode: EditingMode) => {
        // 他の入力項目の編集中に変更ボタンを押下した場合は、先に編集モードを解除する
        if(mode && mode!==editing){
            reset(initFormValue);
        }
        // 編集モードを変更する
        setEditing(mode);
    };

    const onClickCancel = () => {
        // 値を初期値に戻して編集モードを設定する
        reset(initFormValue);
        // 編集モードを解除する
        setEditing(null);
    };

    // ログインUserの更新可否を判定する
    const availableUpdateSelf = (navigation && navigation.allowlist && navigation.allowlist.updateSelfUser);

    // Linkの縦位置をラベルに合わせる
    const valign = {verticalAlign:'baseline'};

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
                                    <label>ユーザー名 <Link2 value='キャンセル' sx={valign} onClick={()=>onClickCancel()} /></label>
                                    :
                                    <label>ユーザー名 <Link2 value='変更する' sx={valign} onClick={()=>onClickUpdate('name')} /></label>
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
                                    <label>メールアドレス <Link2 value='キャンセル' sx={valign} onClick={()=>onClickCancel()} /></label>
                                    :
                                    <label>メールアドレス <Link2 value='変更する' sx={valign} onClick={()=>onClickUpdate('email')} /></label>
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
                                    <label><Link2 value='キャンセル' sx={valign} onClick={()=>onClickCancel()} /></label>
                                    :
                                    <label><Link2 value='現在のパスワードを変更する' sx={valign} onClick={()=>onClickUpdate('password')} /></label>
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
};
