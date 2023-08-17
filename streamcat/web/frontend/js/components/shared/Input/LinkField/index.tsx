import React from 'react';
import {Typography} from '@mui/material';
import { Link2 } from "Shared/Input";

type Props = {
    // ラベル
    label:string;
    // 表示値
    value: string;
    onClick: () => void;
};

/**
 * リンク
 * @param props
 */
export const LinkField = (props:Props) => {
    const {label, value, onClick} = props;

    return  <>
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>{label}</Typography>
        <div>
        <Link2  value={value}
                // 左側と下側をPaddingする
                sx={{lineHeight:'1',
                     paddingLeft:1,
                     paddingBottom:1}}
                onClick={onClick} />
        </div>
    </>;
};
