import React from "react";
import { Button } from "@mui/material"

type Props = {
    icon?: 'add';
    large?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: string;
};

// アイコンテーブル
const basePath = '/front_static'
const iconTable = {
    add: <img src={`${basePath}/images/icon/icon-add.svg`} />
};

export const Button2 = (props:Props) => {
    const {large, disabled, onClick, children} = props;
    // アイコン種別
    const icon = props.icon? iconTable[props.icon]: null;
    // ラベルの表示位置
    // TODO: とりあえずlarge=trueの場合は左に寄せる
    const align = large? {justifyContent: 'flex-start'}: {};
    // ボタンのサイズ設定
    const size = large? {height:0.26, typography:'subtitle1'}: {};

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
