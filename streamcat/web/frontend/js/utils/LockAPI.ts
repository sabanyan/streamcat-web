import {LockType} from 'Model/Locks';
import {
    postBase,
    putBase as put,
    delBase as del,
    makeArrayCtor
} from 'Utils/APIUtilBase';

const post = (url: string, body: {}) => {
    return postBase<LockType>(url, body).then<LockType>(lock => {
        // LockArrayのshift()を用いてlockに各種関数を付与する
        // NOTE: shift()は必ずLockオブジェクトを返す
        return lock && (new LockArray([lock])).shift() as LockType;
    });
};

/**
 * LockArrayのコンストラクタ関数を作成する
 */
const LockArray = makeArrayCtor<LockType>(lock => {
    //
    // Lockオブジェクトに、WebAPIを発行する関数を付与する
    //
    lock.extend = () =>
        put(`/api/v0/locks/${lock.uuid}`, {});
    lock.delete = () =>
        del(`/api/v0/locks/${lock.uuid}`, {});
});

/**
 * Web APIを発行する関数を纏めるクラス
 */
export class LockAPI {
    /**
     * POST /locksを発行してロックを獲得する
     * @param flowUUID 排他ロック対象Datumのuuid
     * @throws {ErrorResponse}
     */
    static createLock = (flowUUID: string, lastModifiedAt?: string) => {
        // lastModifiedAtが指定された場合はロックの再取得をする
        let body: {target:string, lastModifiedAt?:string} = {target: flowUUID};
        lastModifiedAt && (body.lastModifiedAt = lastModifiedAt);
        return post('/api/v0/locks', body);
    };
}
