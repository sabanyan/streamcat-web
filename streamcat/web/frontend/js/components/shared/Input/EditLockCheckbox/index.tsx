import React from "react";
import { useStreamCatNotifications } from "Shared/Notification";
import { Api, ErrorResponse } from 'Api';
import { FlowType } from "Model/Library";
import { Checkbox2 } from "Shared/Input";

export type Value = {
    readOnly?:boolean;
    value: boolean;
    isError: boolean;
};

type Props = {
    readOnly?:boolean;
    target: FlowType;
    state?: [Value, (value:React.SetStateAction<Value>)=>void];
    onChange?: (datum:FlowType) => void;
};

export const EditLockCheckbox = (props:Props) => {
    const {readOnly, target, state} = props;
    const onChange = props.onChange || (() => {});

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // 入力値が変更された時の処理
    const onChangeValue = (value:Value) => {
        // Flowを編集ロックする
        editLockFlow(target, value.value).then(updated => {
            // イベントハンドラを呼び出す
            updated && onChange(updated);
        });
    };

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

    // 編集ロック可能の場合にTrue
    const enabled = target.allowlist.lock;

    return <Checkbox2 label='編集ロック' 
                      readOnly={!enabled || readOnly}
                      state={state}
                      onChange={onChangeValue} />;
};
