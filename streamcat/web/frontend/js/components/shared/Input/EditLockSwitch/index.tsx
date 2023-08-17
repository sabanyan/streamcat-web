import React from 'react';
import { useStreamCatNotifications } from 'Shared/Notification';
import { Api, ErrorResponse } from 'Api';
import { FlowType } from 'Model/Library';
import { TriStateSwitch, Value, TriStateType } from 'Shared/Input/TriStateSwitch';

export type Values = {
    value: boolean[];
    isError: boolean;
};

type Props = {
    readOnly?:boolean;
    targets: FlowType[];
    state?: [Values, (values:React.SetStateAction<Values>)=>void];
    onChange?: (data:FlowType[]) => void;
};

export const EditLockSwitch = (props:Props) => {
    const {readOnly, targets, state} = props;
    const onChange = props.onChange || (() => {});

    // 入力値
    const [values, setValues] = state || [{value:[false],isError:false}, ()=>{}];

    // 初期値を保持する
    const [initStates, ] = React.useState<Values>(values);

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // targetsとValuesの要素数が異なる場合は例外を送出する
    if(state && targets.length !== state[0].value.length){
        throw new Error('targets and state values should be same length');
    }

    // Flowを編集ロックする
    const editLockFlow = (datum:FlowType, editLock:boolean) => {
        // Lockを取得してから編集ロックを変更する
        return Api.createLock(datum.uuid).then(lock => {
            // Flowの編集ロックを変更する
            return datum.updateLock(editLock, lock.uuid).then(updated => {
                return updated;
            }).finally(() => {
                // Flowの編集ロックを変更した後に、Lockを解除する
                lock.delete();
            });
        }).then(updated => {
            if(editLock){
                notifySuccess('フローを編集ロックしました', datum.label);
            }else{
                notifySuccess('フローの編集ロックを解除しました', datum.label);
            }
            return updated;
        }).catch((e:ErrorResponse) => {
            notifyError(`フローの編集ロック変更エラー(${datum.label})`, e.message);
        });
    };

    // 全てのFlowを編集ロックする
    const editLockFlows = (dataAndValues:{datum:FlowType, editLock:boolean}[]) => {
        return Promise.all(
            dataAndValues.map(dataAndValue => editLockFlow(dataAndValue.datum, dataAndValue.editLock))
        ).then(updated => {
            // イベントハンドラを呼び出す
            updated.length > 0 && onChange(updated as FlowType[]);
        }).catch(e => {
            // 失敗してもイベントハンドラを呼び出す
            onChange(dataAndValues.map(dataAndValue => dataAndValue.datum));
        });
    };

    // 全てのFlowが編集ロック可能の場合にTrue
    const enabled = targets.map(target => 
        target.allowlist.lock).reduce((prevAllow, allow) => 
        prevAllow && allow
    );

    // 
    // 対象のフローが2つ以上の場合は3状態のスイッチを用いる
    // 
    if(targets.length > 1){
        // 入力値を変換する
        const value = {
            // 全てのFlowの編集ロックが
            // falseの場合 : 0
            // 混在する場合 : 1
            // trueの場合  : 2
            value : values.value.map(value => 
                        // booleanからnumberに型変換する
                        value? 2: 0 as TriStateType).reduce((prevValue, value) =>
                            prevValue===value? value: 1) ,
            isError : values.isError
        };

        // 入力値の変更関数を変換する
        const setValue = (value:React.SetStateAction<Value<TriStateType>>) => {
            // 変更後の値
            const newValue:number = value['value'];
            if(newValue===0 || newValue===2){
                // 全OFFまたは全ONの場合
                setValues(
                    {value:Array(targets.length).fill(newValue), isError:value['isError']}
                );
            }else{
                // 初期値に戻す場合
                setValues(initStates);
            }
        };

        return <TriStateSwitch<TriStateType> 
            key='tripleState'
            label='編集ロック'
            readOnly={!enabled || readOnly}
            state={ [value, setValue] }
            onChange={value => {
                value.value===1 ?
                // 中間状態に変更された場合は初期値に戻す
                editLockFlows(
                    targets.map((target, i) => ({
                        datum:target, editLock:initStates.value[i]
                    }))
                ) :
                // 全OFFまたは全ONの場合
                editLockFlows(
                    targets.map(target => ({
                        datum:target, editLock:value.value===2
                    }))
                )
            }}
        />;

    }else{
        // 入力値を変換する
        const value = {value:values.value[0], isError:values.isError};

        // 入力値の変更関数を変換する
        const setValue = (value:React.SetStateAction<Value<boolean>>) => {
            // 変更後の値
            const newValue:boolean = value['value'];
            setValues(
                {value:[newValue], isError:value['isError']}
            );
        };

        return <TriStateSwitch<boolean>
            key='doubleState'
            label='編集ロック'
            readOnly={!enabled || readOnly}
            // 2状態のトグルスイッチとして使用する
            doubleState={true}
            state={ [value, setValue] }
            onChange={value => editLockFlows([{datum:targets[0], editLock:value.value}])}
        />;
    }
};
