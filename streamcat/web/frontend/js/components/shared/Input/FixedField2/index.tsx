import React from 'react';
import {Typography} from '@mui/material';

type Props = {
    // ラベル
    label:string;
    // 表示値
    value: string;
    // 表示値をマスキングするか否か
    mask?: boolean;
};

/**
 * テキストボックス
 * @param props
 */
export const FixedField2 = (props:Props) => {
    const {label, value, mask} = props;

    return <>
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>{label}</Typography>
        <Typography variant="body1"
                    color="textPrimary"
                    sx={{lineHeight:'1',
                        paddingLeft:1,
                        paddingBottom:1}}>{mask? value.replace(/./g, '*'): value}</Typography>
    </>;
};
