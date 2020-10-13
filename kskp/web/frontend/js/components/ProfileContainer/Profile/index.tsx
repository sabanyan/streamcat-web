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

    const { handleSubmit, register, errors, watch } = useForm();


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

    const onSubmit = (data,e) => {
        const formState = data;
        setIsLoading(true)

        let body;
        switch (editing){
            case "name":
                body = {
                    name: formState['name']
                }
                break;
            case "email":
                body = {
                    email: formState['email'],
                    currentPassword: formState['currentPassword'],
                }
                break;
            case "password":
                body = {
                    currentPassword: formState['currentPassword'],
                    password: formState['password1'],
                }
        }

        APIUtil.put('users/self', body).then((response) => {
            const json = response.data
            setIsLoading(false)
            if (!json.success){
                ErrorUtil.notifyError(notify,"ユーザー情報更新エラー",json.message);
                return
            }
            notify({
                title: "ユーザー情報を更新しました",
                message: "ユーザー情報を更新しました",
                status: "success"
            });
            setEditing(null);
        }).catch((error) => {
            ErrorUtil.notifyError(notify,"ユーザー情報更新エラー",error);
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
                                <label>ユーザー名 <LinkButton onClick={()=>setEditing(null)}>キャンセル</LinkButton></label>
                                :
                                <label>ユーザー名 <LinkButton onClick={()=>setEditing('name')}>変更する</LinkButton></label>
                        }
                        <TextField readOnly={(editing !=="name")} placeholder={'ユーザ名'} defaultValue={profile.name} name={"name"} inputRef={register({ required: "ユーザー名を入力してください。" })}/>
                        {errors.name && <label className={"text-danger"}>{errors.name.message}</label>}
                    </div>
                    {
                        (editing === "name")?
                            <div className={'text-right'}>
                                <Button submit={true} className={'mr-0'}>保存する</Button>
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
                        <TextField readOnly={(editing !=="email")} placeholder={'メールアドレス'} defaultValue={profile.email} type={'email'} name={"email"}  inputRef={register({ required: "E-mail を入力してください。" })}/>
                        {errors.email && <label className={"text-danger"}>{errors.email.message}</label>}
                    </div>
                    {
                        (editing === "email")?
                            <>
                                <div className={'mb-8px'}>
                                    <label>現在のパスワード</label>
                                    <TextField placeholder={'現在のパスワード'} type={'password'} name={"currentPassword"} inputRef={register}/>
                                </div>
                                <div className={'text-right'}>
                                    <Button submit={true} className={'mr-0'}>保存する</Button>
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
                                    <TextField readOnly={(editing !== "password")} placeholder={'現在のパスワード'} type={'password'} name={"currentPassword"} inputRef={register({ required: '現在のパスワードを入力してください。' })}/>
                                    {errors.currentPassword && <label className={"text-danger"}>{errors.currentPassword.message}</label>}
                                </div>
                                <div className={'mb-8px'}>
                                    <label>新しいパスワード <span className={style.helpText}>10桁以上のパスワードが必要</span></label>

                                    <TextField  placeholder={'新しいパスワード'} type={'password'} name={"password1"} inputRef={register({
                                        required: '新しいパスワードを入力してください',
                                        minLength: {
                                            value: 10,
                                            message: "10桁以上のパスワードが必要です。"
                                        },
                                        maxLength: {
                                            value: 64,
                                            message: "64桁以下のパスワードが必要です。"
                                        },
                                        pattern: {
                                            value: /[!-~]/,
                                            message: "パスワードで利用できる文字は、英数字と記号 !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ のみです。"
                                        }
                                    })}/>
                                    {errors.password1 && <label className={"text-danger"}>{errors.password1.message}</label>}
                                </div>
                                <div className={'mb-8px'}>
                                    <label>新しいパスワード（確認用）</label>
                                    <TextField  placeholder={'新しいパスワード（確認用）'} type={'password'} name={"password2"} inputRef={register({
                                        required: '新しいパスワード（確認用）を入力してください',
                                        validate: (value) =>{
                                            return value === watch('password1') || '新しいパスワードが新しいパスワード（確認用）と一致していません';
                                        }
                                    })}/>
                                    {errors.password2 && <label className={"text-danger"}>{errors.password2.message}</label>}
                                </div>
                                <div className={'text-right'}>
                                    <Button submit={true} className={'mr-0'}>保存する</Button>
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
