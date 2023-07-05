import React from "react";
import {Autocomplete,
        AutocompleteRenderInputParams,
        AutocompleteChangeReason,
        TextField} from "@mui/material";
import {Array2, List2} from "Shared/Input";

export type Values<T> ={
    value: T[];
    isError: boolean;
};

type Props<T> = {
    label: string;
    readOnly?: boolean;
    required?: boolean;
    requiredMessage?:string;
    readOnlyLayout?: 'array'|'list';
    items: T[];
    state?: [Values<T>, (value:React.SetStateAction<Values<T>>)=>void];
    isEqual: (item:T, value:T) => boolean;
    compare?: (item1:T, item2:T) => number;
    isDisabledItem?: (item:T) => boolean;
    getLabel: (value:T) => string;
    onChange?: (value:Values<T>) => void;
    onErrorChange?:(isError:boolean) => void;
};

export const MultiSelect2 = <T,>(props:Props<T>) => {

    // 親コンポーネントで変更可能なvalue.isErrorの値に依存しないよう
    // value.valueの値からエラー状態を判定する
    const isError = (value:T[]) => {
        // 入力必須、かつ入力値が空の場合はエラーにする
        return !!required && (!value || value.length===0);
    };

    const {label, readOnly, required, items, readOnlyLayout, isEqual, compare, isDisabledItem, getLabel} = props;
    const requiredMessage = props.requiredMessage || '入力必須です';
    const [value, setValue] = props.state || [{value:[],isError:isError([])}, () => {}];
    const onChange = props.onChange || (() => {});
    const onErrorChange = props.onErrorChange || (() => {});

    // 入力値の変更の有無
    const [valueChanged, setValueChanged] = React.useState(false);

    // 初期処理
    React.useEffect(() => {
        // value.isErrorに誤った初期値が設定された場合は修正する
        setValue({value:value.value, isError:isError(value.value)});
    }, []);
    
    // 入力値が変更された時の処理
    const onChangeValue = ( e:React.SyntheticEvent<Element,Event>,
                            newValues:T[],
                            reason:AutocompleteChangeReason) => {
        // 値が追加された場合はソートする
        if(reason==='selectOption' && compare){
            // ソート処理は破壊的であることに留意
            newValues.sort(compare);
        }
        // 入力必須、かつ入力値が空の場合はエラーにする
        const error = isError(newValues);
        // 入力値が一度でも変更されたらtrueを設定する
        setValueChanged(true);
        // 入力値を設定する
        setValue({value:newValues, isError:error});
        // イベントハンドラを呼び出す
        onChange({value:newValues, isError:error});
        // エラー状態が変わった場合はイベントハンドラを呼び出す
        if(error!==isError(value.value)){
            onErrorChange(error);
        }
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
                    // 入力値が空の場合はエラーにする
                    // (未入力時はエラー表示をしない)
                    error={valueChanged && isError(value.value)}
                    // エラーメッセージ
                    helperText={(valueChanged && isError(value.value))? requiredMessage: ''}
                    {...params} />;

    return <>{
        readOnly?
        //
        // 入力不可の場合
        //
        (readOnlyLayout==='list'?
            <List2  label={label} items={value.value.map(value=>getLabel(value))} />:
            <Array2 label={label} items={value.value.map(value=>getLabel(value))} />
        ):
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
                        defaultValue={value.value}
                        value={value.value}
                        onChange={onChangeValue}
                        // 紐付けるテキストボックス
                        renderInput={renderInput} />
    }</>;
};
