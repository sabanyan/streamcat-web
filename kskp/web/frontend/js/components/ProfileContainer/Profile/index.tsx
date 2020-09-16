import React, {useEffect, useState} from 'react'
import style from './style.scss'
import {HttpUtil, ReactDomUtil, ErrorUtil} from 'Utils/index'
import {ModalManager} from 'Shared/Modal'
import Constants from 'Constants/index'
import {Form, Loader} from 'Shared/Base'
import {Button, TextField} from 'Shared/Input'
import {useDispatch} from 'react-redux';
import {addNotification, removeNotification} from 'reapop';
import {NotificationManager} from 'Shared/Notification';

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

interface Profile {
    name: string,
    email: string
}

const Profile = () => {

    const dispatch = useDispatch();

    // 通知機能メソッドの取得
    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };

    const [isLoading, setIsLoading] = useState<Boolean>(false);
    const [isFinished, setIsFinished] = useState<Boolean>(false);
    const [profile, setProfile] = useState<Profile | null>({
        name: "",
        email: ""
    });

    useEffect(() => {
        const getProfile = () => {
            setIsLoading(true)
            // user_idはナビゲーションモデルから取得できない
            // APIをたたかないと取得できないため、injectされたuser_idを使う
            HttpUtil.get('profile/' + inject_user_id).then((response) => {
                const json = response.data
                setIsLoading(true);
                setIsFinished(true);
                setProfile(json.data);
            }).catch((error) => {
                notify({
                    title: 'プロフィールの取得エラー',
                    message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                    status: 'error',
                    dismissAfter: 0,
                    closeButton: true
                })
                setIsLoading(false);
                setIsFinished(true);
                //setProfile(null);
            })
        }
        getProfile()
    }, [])

    const onClickSave = () => {
        //ON_SUBMIT_FORMを呼び出すと、Fromコンポーネントの現在のステートを含むSubmitイベントが呼ばれる
        window.emitter.emit(Constants.event.ON_SUBMIT_FORM)
    }

    const onSubmit = (formState) => {
        setIsLoading(true)

        const body = {
            'profile': {
                name: formState['name'],
                email: formState['email'],
                current_password: formState['current_password'],
                new_password: formState['new_password'],
            }
        }

        HttpUtil.put('profile/' + inject_user_id, body).then((response) => {
            const json = response.data
            setIsLoading(false)
        }).catch((error) => {
            setIsLoading(false)
        })
    }

    if (!isFinished || !profile) return <div className={'container mt-40px'}>
        <Loader center={true} absolute={true} visible={isLoading}/>
    </div>

    return <div className={'container mt-40px'}>
        <div className={style.page_title}>
            プロフィール設定
        </div>
        <div className={style.property_body}>
            <div className={style.card}>
                <Form onSubmit={(formState) => onSubmit(formState)}>
                    <div className={'mb-8px'}>
                        <label>ユーザ名</label>
                        <TextField placeholder={'ユーザ名'} defaultValue={profile.name} useForm={true} formKey={'name'}/>
                    </div>
                    <div className={'mb-8px'}>
                        <label>メールアドレス</label>
                        <TextField placeholder={'メールアドレス'} defaultValue={profile.email} type={'email'} useForm={true}
                                   formKey={'email'}/>
                    </div>
                    <div className={'mb-8px'}>
                        <label>パスワード</label>
                        <TextField placeholder={'現在のパスワード'} type={'password'} useForm={true}
                                   formKey={'current_password'}/>
                    </div>
                    <div className={'mb-8px'}>
                        <label>新しいパスワード</label>
                        <TextField placeholder={'新しいパスワード'} type={'password'} useForm={true} formKey={'new_password'}/>
                    </div>
                    <div className={'text-right mt-20px'}>
                        <Button className={'mr-0'} onClick={onClickSave}>保存する</Button>
                    </div>
                </Form>
            </div>
        </div>
        <ModalManager/>
        <NotificationManager/>
    </div>
}

export {Profile}
