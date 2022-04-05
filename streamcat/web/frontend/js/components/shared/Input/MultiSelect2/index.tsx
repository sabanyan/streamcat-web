import React from "react";
import {Autocomplete,
        AutocompleteRenderInputParams,
        AutocompleteChangeReason,
        TextField} from "@mui/material";
import {List2} from "Components/shared/Input";

type Props<T> = {
    label: string;
    readOnly?: boolean;
    required?: boolean;
    items: T[];
    state?: [T[], (value:React.SetStateAction<T[]>)=>void];
    isEqual: (item:T, value:T) => boolean;
    isDisabledItem: (item:T) => boolean;
    getLabel: (value:T) => string;
    onChange?: (values:T[]) => void;
};

export const MultiSelect2 = <T,>(props:Props<T>) => {
    const {label, readOnly, required, items, isEqual, isDisabledItem: isDisabledItem, getLabel} = props;
    const onChange = props.onChange || (() => {});

    const [values, setValues] = props.state || [[], () => {}];

    // 入力値が変更された時の処理
    const onChangeValue = ( e:React.SyntheticEvent<Element,Event>,
                            values:T[],
                            reason:AutocompleteChangeReason) => {
        // 入力値を設定する
        setValues(values);
        // イベントハンドラを呼び出す
        onChange(values);
    };

    // テキストボックス
    const renderInput = (params:AutocompleteRenderInputParams) => 
        <TextField  label={label}
                    // 入力必須記号*の表示する
                    required={required}
                    // // 小さく表示する
                    // size='small'
                    // // ある程度の横幅を設定する
                    // fullWidth={true}
                    // labelの表示域を確保する
                    margin='dense'
                    // 枠線を設定する
                    variant='outlined'
                    {...params} />;

    return <>{
        readOnly?
        // 
        // 入力不可の場合
        //
        <List2 label={label} items={values.map(value=>getLabel(value))} />:
        // 
        // 入力可の場合
        //
        <Autocomplete //複数選択可
                        multiple={true}
                        readOnly={readOnly}
                        // 全ての選択肢を設定する
                        options={items}
                        // 選択肢の同値を判定する関数
                        isOptionEqualToValue={isEqual}
                        // 選択不可の判定をする関数
                        getOptionDisabled={isDisabledItem}
                        // 選択肢からタグのラベルを返す関数
                        getOptionLabel={getLabel}
                        // 初期表示値
                        defaultValue={values}
                        value={values}
                        onChange={onChangeValue}
                        // 紐付けるテキストボックス
                        renderInput={renderInput} />
    }</>;
};
