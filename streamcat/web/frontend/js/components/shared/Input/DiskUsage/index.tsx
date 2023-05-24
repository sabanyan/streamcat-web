import React from 'react';
import { LinearProgress, Typography, Box} from '@mui/material';
import {StringUtil} from "Utils/index";
import { DiskUsageType } from 'Model/Navigation/NavigationModel';

interface Props {
    // ディスク使用量情報
    diskUsage?: DiskUsageType
};

/**
 * ディスク使用量グラフ
 */
export const DiskUsage = (props: Props) => {
    if(! props.diskUsage){
        return <></>;
    }
    // ディスク容量と使用量
    const {total, used} = props.diskUsage;
    // 表示文字列に変換する
    const totalSize = StringUtil.convertToFileSize(total);
    const usedSize = StringUtil.convertToFileSize(used, false);
    // ディスク使用率
    const usageRate = (used / total) * 100

    return <Box sx={{pl:2, pr:2}}>
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>{`${usedSize} / ${totalSize}`}</Typography>
        <LinearProgress variant='determinate' value={usageRate} sx={{height:16, borderRadius:1}}/>
    </Box>;
};
