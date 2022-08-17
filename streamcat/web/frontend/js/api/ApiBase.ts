// 
// NOTE: JavaScriptではJavaのようにcatch構文で例外オブジェクトに型に応じて処理を振り分ける事はできない
// その場合はcatch内で例外オブジェクトの型を判定する

// NOTE: instanceof演算子はオブジェクトの型の判定に使用されるが
// その右辺値にはtypeやinterfaceの型アノテーションは指定できない
// 代わりにClass等のprotptypeプロパティを保持するオブジェクトを指定する
// https://stackoverflow.com/questions/46703364
export class ErrorResponse {
    constructor(public code:number, public message:string) {
        this.code = code;
        this.message = message;
    }
};

/**
 * ResponseオブジェクトからJSONを取り出す
 * @param res 
 */
export const toJsonOrRaise = (res: Response) => {
    if(res.status===200) {
        // API発行が成功し、データが返された場合
        return res.json();
    }else if(res.status===204){
        // API発行が成功し、データが返されない場合
        return Promise.resolve();
    }else{
        // 失敗した場合
        return res.json().then(json => {
            throw new ErrorResponse(json.code || Number.NaN, json.message || '');
        }).catch(e => {
            throw new ErrorResponse(Number.NaN, e.message || '');
        });
    }
};

/**
 * GET APIを発行する
 * @param url
 * @throws {ErrorResponse}
 */
export const getBase = <TDatumType>(url: string, params?: {}) => {
    if(params) {
        url += '?' + Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    }
    return fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }
    ).then<TDatumType>(
        // fetch()はHTTPステータスコードがエラーでもrejectしない
        res => toJsonOrRaise(res)
    );
};

/**
 * POST APIを発行する
 * @param url
 * @throws {ErrorResponse}
 */
export const postBase = <TDatumType>(url: string, body: {}) => {
    return fetch(
        url,
        {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    ).then<TDatumType>(
        res => toJsonOrRaise(res)
    );
};

/**
 * PUT APIを発行する
 * @param url
 * @throws {ErrorResponse}
 */
export const putBase = <TDatumType>(url: string, body: {}) => {
    return fetch(
        url,
        {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    ).then<TDatumType>(
        res => toJsonOrRaise(res)
    );
};

/**
 * DELETE APIを発行する
 * @param url
 * @throws {ErrorResponse}
 */
export const delBase = (url: string, body={}) => {
    return fetch(
        url,
        {
            method: 'DELETE',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    ).then<void>(
        res => toJsonOrRaise(res)
    );
};

// Arrayのコンストラクタ関数の型
type Ctor<TType> = new (data: TType[]) => TType[];

/**
 * Arrayのコンストラクタ関数を作成する
 * このコンストラクタ関数で生成したArrayのmap()やshift()の実行時に、Arrayの要素であるDatumにWebAPIを発行する関数を付与する
 * @param setAPIFunc 
 * @returns 
 */
export const makeArrayCtor = <TType>(setAPIFunc: (datum:TType)=>void) : Ctor<TType> => {
    /**
     * DatumにWebAPIを発行する関数を付与する
     * @param data Datumのリスト
     */
    const ArrayCtor = function(this: any, data: TType[]) {
        // NOTE: Arrow形式のコンストラクタ関数内ではthisを参照できない
        // NOTE: TypeScriptではコンストラクタ関数にはthis引数が必要のようだ
        // 
        // this: new ArrayCtor()で生成するオブジェクト
        Array.prototype.push.apply(this, data);
    };

    // ArrayCtorはArrayオブジェクトを継承する
    // Object.create: 指定したプロトタイプオブジェクトを持つオブジェクトを生成する
    // NOTE: https://stackoverflow.com/questions/26630676
    ArrayCtor.prototype = Object.create(Array.prototype);
    ArrayCtor.prototype.constructor = ArrayCtor;

    // map関数をオーバーライドする
    // map関数でDatumのリストをイテレートする時に、WebAPIを発行する関数を付与する
    // こうすることで無駄にDatumのリストをイテレートするのを防ぐ
    ArrayCtor.prototype.map = function(callbackfn: (datum: TType, index: number, array: TType[]) => TType,
                                       thisArg?: any) : any {
        // Arrayのmap関数に渡すコールバック関数
        let wrapCallbackfn;

        if(this.__isWrapped) {
            // 既にラッパー処理済みの場合は何もしない
            wrapCallbackfn = callbackfn;
        }else{
            // 未ラッパーの場合はラッパー処理を行う
            this.__isWrapped = true;

            // ラッパー処理をする関数を作成する
            wrapCallbackfn = (datum: TType, index: number, array: TType[]) => {
                // オブジェクトに、WebAPIを発行する関数を付与する
                setAPIFunc(datum);
                // map関数に渡されたコールバック関数を実行する
                return callbackfn(datum, index, array);
            }
        }

        // Arrayのmapメソッドを、this=[ArrayCtorのインスタンス]で呼び出す
        // NOTE: TypeScriptにargumentsキーワードは存在しない
        return Array.prototype.map.apply(this, [wrapCallbackfn, thisArg]);
    };

    // find関数をオーバーライドする
    ArrayCtor.prototype.find = function(callbackfn: (value: TType, index: number, array: TType[]) => boolean,
                                        thisArg?: any) {
        // this: new ArrayCtor()で生成するオブジェクト
        return ArrayCtor.prototype.map.apply(this, [datum => datum]).find(callbackfn, thisArg);
    };

    // slice関数をオーバーライドする
    ArrayCtor.prototype.slice = function(start?: number, end?: number) {
        // this: new ArrayCtor()で生成するオブジェクト
        return ArrayCtor.prototype.map.apply(this, [datum => datum]).slice(start, end);
    };

    // shift関数をオーバーライドする
    ArrayCtor.prototype.shift = function() {
        // this: new ArrayCtor()で生成するオブジェクト
        return ArrayCtor.prototype.map.apply(this, [datum => datum]).shift();
    };

    // pop関数をオーバーライドする
    ArrayCtor.prototype.pop = function() {
        // this: new ArrayCtor()で生成するオブジェクト
        return ArrayCtor.prototype.map.apply(this, [datum => datum]).pop();
    };

    // filter関数をオーバーライドする
    ArrayCtor.prototype.filter = function(callbackfn: (value: TType, index: number, array: TType[]) => boolean,
                                          thisArg?: any) {
        // this: new ArrayCtor()で生成するオブジェクト
        return ArrayCtor.prototype.map.apply(this, [datum => datum]).filter(callbackfn, thisArg);
    };

    return ArrayCtor as any;
};
