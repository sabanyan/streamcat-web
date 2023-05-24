import React from 'react';
import {Link, SxProps, Theme} from '@mui/material';

type Props = {
    // 表示値
    value: string;
    sx? : SxProps<Theme>;
    onClick: (e: React.SyntheticEvent<HTMLElement,Event>) => void;
};

/**
 * リンク
 * @param props
 */
export const Link2 = (props:Props) => {
    const {value, onClick} = props;

    return <Link
        // 下線を表示しない
        underline='none'
        // リンクをポイントしたときにカーソル形状をボタンと同じにする
        component='button'
        // 縦位置を合わせる
        sx={props.sx}
        onClick={(e:React.SyntheticEvent<HTMLElement,Event>) => {
            // リンク押下時のデフォルトの動作を取り消す
            e.preventDefault();
            // onClickを呼び出す
            onClick(e);
        }} >
        {value}
    </Link>;
};
