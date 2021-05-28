import React, {useEffect, useState} from 'react'
import style from './style.scss'
import {APIUtil, ReactDomUtil, ErrorUtil} from 'Utils/index'
import {ModalManager} from 'Shared/Modal'
import {Flex, Loader} from 'Shared/Base'
import {Button, LinkButton, TextField} from 'Shared/Input'
import {useDispatch} from 'react-redux';
import {addNotification, removeNotification} from 'reapop';
import {NotificationManager} from 'Shared/Notification';
import {useForm} from 'react-hook-form';
import {Props as NavigationModelProps} from 'Model/Navigation/NavigationModel';

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */
interface Props {
    navigation?: NavigationModelProps
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

const Profile = (props: Props) => {

    // 通知機能メソッドの取得
    const dispatch = useDispatch();
    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };

    const {navigation} = props;
    const availableUpdateSelf = (navigation && navigation.allowlist && navigation.allowlist.updateSelfUser)

    const [isLoading, setIsLoading] = useState<Boolean>(false);
    const [isFinished, setIsFinished] = useState<Boolean>(false);
    const [profile, setProfile] = useState<Profile | null>({
        name: '',
        email: ''
    });
    const {handleSubmit, register, errors, watch, clearErrors, reset} = useForm<FormInputs | any>({
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
            reset(resetValue)
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
            notify({
                title: 'プロフィールの取得エラー',
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
                status: 'error',
                dismissAfter: 0,
                closeButton: true
            })
            setIsLoading(false);
            setIsFinished(true);
        })
    }

    const onSubmit = (data) => {
        const formState = data;
        setIsLoading(true);
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
                    {
                        (editing === 'email') ?
                            <>
                                <div className={'mb-8px'}>
                                    <label>現在のパスワード</label>
                                    <TextField placeholder={'現在のパスワード'} type={'password'} name={'currentPassword'}
                                               inputRef={register}/>
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
                                                       type={'password'} name={'currentPassword'}
                                                       inputRef={register({required: '現在のパスワードを入力してください。'})}/>
                                            {errors.currentPassword &&
                                            <label className={'text-danger'}>{errors.currentPassword.message}</label>}
                                        </div>
                                        <div className={'mb-8px'}>
                                            <label>新しいパスワード <span
                                                className={style.helpText}>10桁以上のパスワードが必要</span></label>

                                            <TextField placeholder={'新しいパスワード'} type={'password'} name={'password1'}
                                                       inputRef={register({
                                                           required: '新しいパスワードを入力してください',
                                                           minLength: {
                                                               value: 10,
                                                               message: '10桁以上のパスワードが必要です。'
                                                           },
                                                           maxLength: {
                                                               value: 64,
                                                               message: '64桁以下のパスワードが必要です。'
                                                           },
                                                           pattern: {
                                                               value: /[!-~]/,
                                                               message: 'パスワードで利用できる文字は、英数字と記号 !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~ のみです。'
                                                           }
                                                       })}/>
                                            {errors.password1 &&
                                            <label className={'text-danger'}>{errors.password1.message}</label>}
                                        </div>
                                        <div className={'mb-8px'}>
                                            <label>新しいパスワード（確認用）</label>
                                            <TextField placeholder={'新しいパスワード（確認用）'} type={'password'}
                                                       name={'password2'}
                                                       inputRef={register({
                                                           required: '新しいパスワード（確認用）を入力してください',
                                                           validate: (value) => {
                                                               return value === watch('password1') || '新しいパスワードが新しいパスワード（確認用）と一致していません';
                                                           }
                                                       })}/>
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
