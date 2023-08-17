import { useStreamCatNotifications } from "Shared/Notification";
import { Api } from 'Api';
import { typeNames } from "Utils/TypeNames";
import { DatumType } from "Model/Library";

const useMoveDatum = () => {
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // Datumの移動処理の関数を返す
    return (datum:DatumType, newParent:string) => {
        let promise: Promise<DatumType>;
        if (datum.type === 'flow') {
            // Flowの場合は、Lockを取得してから移動する
            promise = Api.createLock(datum.uuid).then(lock => {
                // Datumを移動する
                return datum.move(newParent, lock.uuid).finally(() => {
                    // Flowの移動が完了した後に、Lockを解除する
                    lock.delete();
                });
            });
        }else{
            // Datumを移動する
            promise = datum.move(newParent); 
        }
        // 移動完了メッセージを表示する
        return promise.then(datum => {
            const typeLabel = typeNames[datum.type];
            notifySuccess(typeLabel + 'を移動しました', datum.label);
            return datum;
        }).catch((e) => {
            notifyError(`ライブラリー移動エラー(${datum.label})`, e.message);
            return datum;
        });
    };
};

// 全てのDatumを移動する
export const useMoveData = () => {
    // Datumの移動処理の関数を取得する
    const moveDatum = useMoveDatum();
    
    // 複数のDatumの移動処理の関数を取得する
    return (data:DatumType[], newParent:string, onSuccess?:(targets:DatumType[]) => void) => {
        // 全てのDatumを移動した後に、イベントハンドラを呼び出す
        Promise.all(
            data.map(datum => moveDatum(datum, newParent))
        ).then(data => {
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(data);
            return data;
        }).catch(e => {
            // 失敗してもイベントハンドラを呼び出す
            // TODO: ただしonSuccessには全て移動前のDatumが渡される
            onSuccess && onSuccess(data);
        });
    };
};
