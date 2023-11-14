import React from 'react';
import { LinearProgress, Typography, Box} from '@mui/material';
import {StringUtil} from "Utils/index";
import { StorageUsageType } from 'Model/Navigation/NavigationModel';

type Props = {
    // ストレージ使用量情報
    storageUsage?: StorageUsageType
};

/**
 * ストレージ使用量グラフ
 */
export const StorageUsage = (props: Props) => {
    if(! props.storageUsage){
        return <></>;
    }
    // ストレージ容量と使用量
    const {total, used} = props.storageUsage;
    // 表示文字列に変換する
    const totalSize = StringUtil.convertToFileSize(total);
    const usedSize = StringUtil.convertToFileSize(used, false);
    // ストレージ使用率
    const usageRate = (used / total) * 100

    return <Box sx={{pl:2, pr:2}}>
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>{`${usedSize} / ${totalSize}`}</Typography>
        <LinearProgress variant='determinate' value={usageRate} sx={{height:16, borderRadius:1}}/>
    </Box>;
};
