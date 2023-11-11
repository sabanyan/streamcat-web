import React from 'react';
import { Button, Theme } from '@mui/material'

type Props = {
    icon?: 'add'|'upload'|'trash';
    large?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: string;
};

// アイコンテーブル
const iconBasePath = '/front_static/images/icon'
const iconTable = {
    add    : <img src={`${iconBasePath}/icon-add.svg`} />,
    upload : <img src={`${iconBasePath}/icon-upload.svg`} />,
    trash  : <img src={`${iconBasePath}/icon-trash.svg`} />
};

export const Button2 = (props:Props) => {
    const {large, disabled, onClick, children} = props;
    // アイコン種別
    const icon = props.icon? iconTable[props.icon]: null;
    // ラベルの表示位置
    // TODO: とりあえずlarge=trueの場合は左に寄せる
    const align = large? {justifyContent: 'flex-start'}: {};
    // ボタンのサイズ設定
    const size = large? {height:'3rem', typography:(theme:Theme) => theme.typography.subtitle1}: {};

    return <Button  // ラベルの左側にアイコンを表示する
                    startIcon={icon}
                    // 枠線を表示する
                    variant='outlined'
                    // ラベルを左に寄せる
                    style={align}
                    // Marginとサイズ設定
                    sx={{mr:1, mb:1, ...size}}
                    disabled={disabled}
                    onClick={onClick}>{children}</Button>;
};
