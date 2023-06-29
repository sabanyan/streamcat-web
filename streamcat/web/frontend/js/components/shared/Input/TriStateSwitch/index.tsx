import React from 'react';
import {Slider, Typography, Box} from '@mui/material';

export type TriStateType = 0|1|2;

export type Value<TValue,> = {
    value: TValue;
    isError: boolean;
};

type Props<TValue,> = {
    label: string;
    readOnly?: boolean;
    doubleState?: boolean;
    state?: [Value<TValue>, (value:React.SetStateAction<Value<TValue>>)=>void];
    onChange?: (value:Value<TValue>) => void;
};

export const TriStateSwitch = <TValue=TriStateType|boolean,>(props:Props<TValue>) => {
    const {label, readOnly, doubleState} = props;
    const falcy = doubleState? false: 0;
    const [value, setValue] = props.state || [{value:falcy as TValue,isError:false}, () => {}];
    const onChange = props.onChange || (() => {});

    // 初期処理
    React.useEffect(() => {
        // value.isErrorに誤った初期値が設定された場合は修正する
        setValue({value:value.value, isError:false});
    }, []);

    // 入力値が変更された時の処理
    const onChangeValue = (newValue:number) => {
        if(newValue < 0 || 2 < newValue){
            throw new Error('invalid TriStateSwitch value');
        }
        // 同じ値に設定した場合でもonChangeCommittedが呼び出されてしまう
        // (numberとbooleanの比較もするので'=='を用いる)
        if(newValue == value.value){
            return;
        }
        // 入力値を設定する
        setValue({value:newValue as TValue, isError:false});
        // イベントハンドラを呼び出す
        onChange({value:newValue as TValue, isError:false});
    };

    return <>
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>{label}</Typography>
        <Box>
            {/* スライダーをスイッチに見立てる */}
            <Slider size='medium'
                    sx={{width: '3rem',
                        // スイッチの幅を太くする
                        height: '1.2rem',
                        // ラベルとスイッチの間を詰める
                        padding: 0,
                        // スイッチをインデントする
                        marginLeft: '1rem',
                        '& .MuiSlider-rail': {color: 'gray'}
                    }}
                    disabled={readOnly}
                    // 中立状態にドットを表示する
                    marks={doubleState? []: [{label:'', value:1}]}
                    // 最小値
                    min={0}
                    // 最大値
                    max={doubleState? 1: 2}
                    // 増分値
                    step={1}
                    // booleanに単項演算子(+)を付けるとnumberに変換される
                    value={+value.value}
                    // マウスボタンを離した時に呼び出される
                    onChangeCommitted={(e,v) => onChangeValue(v as number)} />
        </Box>
    </>;
};
