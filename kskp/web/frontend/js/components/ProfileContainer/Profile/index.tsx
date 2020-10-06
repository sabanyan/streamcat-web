import React, {useEffect, useState} from 'react'
import style from './style.scss'
import {APIUtil, ReactDomUtil, ErrorUtil} from 'Utils/index'
import {ModalManager} from 'Shared/Modal'
import {Flex, Loader} from 'Shared/Base'
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

    const onClickSave = () => {

    }

    const onSubmit = (data,e) => {
        const formState = data;
        setIsLoading(true)

        const body = {};

        if(profile && formState['name'] !== profile.name){
            // 名前に変更があった場合
            body["name"] = formState['name']
        }

        if(profile && formState['email'] !== profile.email){
            // emailに変更があった場合
            body["email"] = formState['email']
        }

        if(formState['currentPassword']){
            // 名前に変更があった場合
            body["currentPassword"] = formState['currentPassword']
        }

        if(formState['password']){
            // 名前に変更があった場合
            body["password"] = formState['password']
        }

        if(!Object.keys(body).length){
            notify({
                title: "プロフィールの保存エラー",
                message: "プロフィール設定が更新されていません",
                status: "error",
                dismissAfter: 0,
                closeButton: true
            });
            return
        }

        APIUtil.put('users/self', body).then((response) => {
            const json = response.data
            setIsLoading(false)
            if (!response.data.success) {
                notify({
                    title: "プロフィールの保存エラー",
                    message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
                    status: "error",
                    dismissAfter: 0,
                    closeButton: true
                });
            } else {
                notify({
                    title: "プロフィールの保存",
                    message: "プロフィールを保存しました。",
                    status: "success"
                });
            }
        }).catch((error) => {
            notify({
                title: 'プロフィールの保存エラー',
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                status: 'error',
                dismissAfter: 0,
                closeButton: true
            });
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
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={'mb-8px'}>
                        <label>ユーザ名</label>
                        <Flex alignItems={"center"} justifyContent={"space-between"}>
                            <Flex width={"100%"}>
                                <TextField placeholder={'ユーザ名'} defaultValue={profile.name} name={"name"} readOnly={true} inputRef={register}/>
                            </Flex>
                            <Flex width={100}>
                                <LinkButton>変更する</LinkButton>
                            </Flex>
                        </Flex>
                    </div>
                </form>
            </div>
        </div>

        <div className={style.property_body}>
            <div className={style.card}>
                <div className={'mb-8px'}>
                    <label>メールアドレス</label>
                    <Flex alignItems={"center"} justifyContent={"space-between"}>
                        <Flex width={"100%"}>
                            <TextField placeholder={'メールアドレス'} defaultValue={profile.email} type={'email'} name={"email"} readOnly={true}  inputRef={register}/>
                        </Flex>
                        <Flex width={100}>
                            <LinkButton>変更する</LinkButton>
                        </Flex>
                    </Flex>
                </div>
                {
                    (watch('email') && watch('email') !== profile.email)?
                        <div className={'mb-8px'}>
                            <label>現在のパスワード</label>
                            <TextField placeholder={'現在のパスワード'} type={'password'} name={"currentPassword"} inputRef={register({
                                required: "Required",
                                pattern: {
                                    value: /^[\x20-\x7e]*$/,
                                    message: "パスワードに利用できない文字列が含まれています"
                                },
                                minLength: {
                                    value: 10,
                                    message: "パスワードは最低10文字必要です"
                                },
                                maxLength: {
                                    value: 64,
                                    message: "パスワードは最大64文字までです"
                                }
                            })}/>
                        </div>
                        :
                        null
                }
            </div>
        </div>
        <div className={style.property_body}>
            <div className={style.card}>
                <div className={'mb-8px'}>
                    <label>パスワード</label>
                    <Flex alignItems={"center"} justifyContent={"space-between"}>
                        <Flex width={"100%"}>
                            <TextField placeholder={'パスワード'} type={'password'} name={"password"} readOnly={true} inputRef={register({
                                required: "Required",
                                pattern: {
                                    value: /^[\x20-\x7e]*$/,
                                    message: "パスワードに利用できない文字列が含まれています"
                                },
                                minLength: {
                                    value: 10,
                                    message: "パスワードは最低10文字必要です"
                                },
                                maxLength: {
                                    value: 64,
                                    message: "パスワードは最大64文字までです"
                                }
                            })}/></Flex>
                        <Flex width={100}>
                            <LinkButton>変更する</LinkButton>
                        </Flex>
                    </Flex>

                </div>
            </div>
        </div>
        <ModalManager/>
        <NotificationManager/>
    </div>
}

export {Profile}
