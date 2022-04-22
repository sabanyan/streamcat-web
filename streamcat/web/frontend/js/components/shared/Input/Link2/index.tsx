import React from 'react';
import {Link, Typography} from '@mui/material';

type Props = {
    // ラベル
    label:string;
    // 表示値
    value: string;
    onClick: () => void;
};

/**
 * テキストボックス
 * @param props
 */
export const Link2 = (props:Props) => {
    const {label, value, onClick} = props;

    return  <>
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>{label}</Typography>
        <div>
        <Link // 下線を表示しない
            underline='none'
            // リンクをポイントしたときにカーソル形状をボタンと同じにする
            component='button'
            sx={{lineHeight:'1',
                 paddingLeft:1,
                 paddingBottom:1}}
            // リンクをクリックしたときにonClickを呼び出す
            onClick={onClick} >{value}</Link>
        </div>
    </>;
};
