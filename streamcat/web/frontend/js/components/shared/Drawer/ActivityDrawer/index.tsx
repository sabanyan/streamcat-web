import React from "react"
import { Link, Typography } from "@mui/material";
import { ActivityType } from "Model/Library";
import { Drawer2, FixedField2, List2 } from "Shared/Input";
import WebUtil from "Utils/WebUtil";
import StringUtil from "Utils/StringUtil";
import { CreatorField } from "Shared/Input/CreatorField";

type Props = {
    activity: ActivityType;
};

export const ActivityDrawer = (props:Props) => {
    const { activity } = props;

    const formatDateTime = (dateTime:string) => {
        const d = new Date(dateTime);

        // "2020/09/06 13:55:43"の書式の日付文字列を作成する
        // NOTE: JavaScriptではDateオブジェクトから書式指定して日付文字列を得る方法が無い
        // https://future-architect.github.io/typescript-guide/otherbuiltinobjects.html#id5
        return `${
            d.getFullYear()
        }-${
            String(d.getMonth() + 1).padStart(2, '0')
        }-${
            String(d.getDate()).padStart(2, '0')
        } ${
            String(d.getHours()).padStart(2, '0')
        }:${
            String(d.getMinutes()).padStart(2, '0')
        }:${
            String(d.getSeconds()).padStart(2, '0')
        }`;
    };

    const interval = (from:Date, to:Date) => {
        // 時刻の差分を算出する
        const milliSec = to.getTime() - from.getTime();
        // ミリ秒を秒数に変換
        const diffSec = milliSec / 1000;
        // ミリ秒を分数に変換
        const diffMinutes = diffSec / 60;
        // ミリ秒を時間に変換
        const diffHours = diffMinutes / 60;
        // "01:02:00"の書式の時刻文字列を作成する
        return `${
            String(Math.round(diffHours)).padStart(2, '0')
        }:${
            String(Math.round(diffMinutes)).padStart(2, '0')
        }:${
            String(Math.round(diffHours)).padStart(2, '0')
        }`;
    };

    // 実行結果へのリンク
    const resultLinks = activity.outs.map(out =>
        <Link underline='none'
            // リンクをポイントしたときにカーソル形状をボタンと同じにする
            component='button'
            onClick={() =>
                // プレビューウインドウを開く
                window.open(
                    WebUtil.webURL(
                        `/preview?step_id=${out.id}&dialog=false&frame_uuid=${out.datum}&title=${StringUtil.urlEncode(out.label)}`
                    )
                )
            } 
        >{out.label}</Link>
    );

    // エラーメッセージ
    const errors = activity.exs.map(ex => 
        <>
            <Typography variant='body1'
                        sx={{color:'error.main'}}>{ex.label}</Typography>
            <Typography variant='body2'
                        sx={{paddingLeft:1}}>{ex.message}</Typography>
        </>
    );

    return <Drawer2>
        <FixedField2 key='label'
                     label='ラベル'
                     value={activity.label} />
        <FixedField2 key='startAt'
                     label='開始日時'
                     value={formatDateTime(activity.startAt)} />
        <FixedField2 key='interval'
                     label='処理時間'
                     // 終了日時が設定せれてない場合は'実行中'を表示する  
                     value={activity.endAt ?
                            interval(new Date(activity.endAt), new Date(activity.startAt)) :
                            '実行中⏳'} />
        <List2       key='results'
                     label='実行結果'
                     items={[...resultLinks, ...errors]} />
        <CreatorField key='creator' datum={activity} />
    </Drawer2>;
};
