import React, {useEffect, useState} from 'react'
import style from './style.scss'
import {APIUtil, ReactDomUtil, ErrorUtil} from 'Utils/index'
import {ModalManager} from 'Shared/Modal'
import {Loader} from 'Shared/Base'
import {Button, LinkButton, TextField} from 'Shared/Input'
import {useDispatch} from 'react-redux';
import {addNotification, removeNotification} from 'reapop';
import {NotificationManager} from 'Shared/Notification';
import { useForm } from "react-hook-form";

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

    const { handleSubmit, register, errors } = useForm();


    const [editing, setEditing] = useState<('name' | 'email' | 'password' | null)>(null);

    useEffect(() => {
        const getProfile = () => {
            setIsLoading(true)
            // user_idはナビゲーションモデルから取得できない
            // APIをたたかないと取得できないため、injectされたuser_idを使う
            APIUtil.get('/users/self').then((response) => {
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

    const onClickSaveName = () => {

    }

    const onClickSaveEmail = () => {

    }

    const onClickSavePassword = () => {

    }

    const onSubmit = (data,e) => {
        const formState = data;
        setIsLoading(true)

        const body = {
            name: formState['name'],
            email: formState['email'],
            currentPassword: formState['currentPassword'] || null,
            password: formState['password'] || null,
        }

        APIUtil.put('users/self', body).then((response) => {
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
                <form onSubmit={handleSubmit(onSubmit)} className={"mb-32px"}>
                    <div className={'mb-8px'}>
                        {
                            (editing === "name")?
                                <label>ユーザ名 <LinkButton onClick={()=>setEditing(null)}>キャンセル</LinkButton></label>
                                :
                                <label>ユーザ名 <LinkButton onClick={()=>setEditing('name')}>変更する</LinkButton></label>
                        }
                        <TextField readOnly={(editing !=="name")} placeholder={'ユーザ名'} defaultValue={profile.name} name={"name"} inputRef={register}/>
                    </div>
                    {
                        (editing === "name")?
                            <div className={'text-right'}>
                                <Button submit={true} className={'mr-0'} onClick={onClickSaveName}>保存する</Button>
                            </div>
                            :
                            null
                    }
                </form>

                <form onSubmit={handleSubmit(onSubmit)} className={"mb-32px"}>
                    <div className={'mb-8px'}>
                        {
                            (editing === "email")?
                                <label>メールアドレス <LinkButton onClick={()=>setEditing(null)}>キャンセル</LinkButton></label>
                                :
                                <label>メールアドレス <LinkButton onClick={()=>setEditing('email')}>変更する</LinkButton></label>
                        }
                        <TextField readOnly={(editing !=="email")} placeholder={'メールアドレス'} defaultValue={profile.email} type={'email'} name={"email"}  inputRef={register}/>
                    </div>
                    {
                        (editing === "email")?
                            <>
                                <div className={'mb-8px'}>
                                    <label>現在のパスワード</label>
                                    <TextField placeholder={'現在のパスワード'} type={'password'} name={"currentPassword"} inputRef={register}/>
                                </div>
                                <div className={'text-right'}>
                                    <Button submit={true} className={'mr-0'} onClick={onClickSaveEmail}>保存する</Button>
                                </div>
                            </>
                        : null
                    }
                </form>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <label>
                        {
                            (editing === "password")?
                                <LinkButton onClick={()=>setEditing(null)}>キャンセル</LinkButton>
                                :
                                <LinkButton onClick={()=>setEditing('password')}>現在のパスワードを変更する</LinkButton>
                        }
                    </label>
                    {
                        (editing === "password")?
                            <>
                                <div className={'mb-8px'}>
                                    <label>現在のパスワード</label>
                                    <TextField readOnly={(editing !== "password")} placeholder={'現在のパスワード'} type={'password'} name={"currentPassword"} inputRef={register}/>
                                </div>
                                <div className={'mb-8px'}>
                                    <label>新しいパスワード</label>
                                    <TextField  placeholder={'新しいパスワード'} type={'password'} name={"password"} inputRef={register}/>
                                </div>
                                <div className={'text-right'}>
                                    <Button submit={true} className={'mr-0'} onClick={onClickSavePassword}>保存する</Button>
                                </div>
                            </>
                            : null
                    }
                </form>

            </div>
        </div>
        <ModalManager/>
        <NotificationManager/>
    </div>
}

export {Profile}
