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
const toJsonOrRaise = (res: Response) => {
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
 * ResponseオブジェクトからBLOBを取り出す
 * @param res 
 */
const toBlobOrRaise = (res: Response) => {
    if(res.status===200) {
        // API発行が成功し、データが返された場合
        return res.blob();
    }else if(res.status===204){
        // API発行が成功し、データが返されない場合
        return Promise.resolve(new Blob());
    }else{
        // 失敗した場合
        throw new ErrorResponse(Number.NaN, res.statusText);
    }
};

const JsonStringify = (body:{}) => {
    // Ctor<AllNodeType>型はArray型ではないので、lengthプロパティがJSON文字列から除外されない
    // これを除外するためのreplacer関数を用意する
    const replacer = (key:string, value) => {
        // 値に__allAPIFuncSetプロパティがあればCtor<AllNodeType>型と見做す
        if(value && value.__allAPIFuncSet){
            // __allAPIFuncSet, lengthプロパティをJSON文字列から除外する
            return [...value];
        }else{
            return value;
        }
    };
    return JSON.stringify(body, replacer);
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
            body: JsonStringify(body),
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
            body: JsonStringify(body),
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
export const delBase = <TDatumType>(url: string, body={}) => {
    return fetch(
        url,
        {
            method: 'DELETE',
            body: JsonStringify(body),
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
 * GET APIを発行してファイルをダウンロードする
 * @param url
 * @param accept
 * @param fileName
 * @throws {ErrorResponse}
 */
export const download = (url: string, accept: string, fileName?: string, params?: {}) => {
    if(params) {
        url += '?' + Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    }
    return fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Accept': accept
            }
        }
    ).then(res => {
        // ダウンロードしたファイル名を取得する
        const fileName = res.headers.get('Content-Disposition')?.split('filename=')[1];
        return toBlobOrRaise(res).then(blob => ({blob:blob, fileName:fileName}));
    }).then(
        // Fetch API to force download file
        // https://stackoverflow.com/questions/44168090/fetch-api-to-force-download-file
        blob => {
            const href = window.URL.createObjectURL(blob.blob);
            Object.assign(
                document.createElement('a'),
                {
                    href,
                    download: fileName || blob.fileName
                }
            ).click();
        }
    );
};

/**
 * POST APIを発行してファイルをアップロードする
 * @param url
 * @throws {ErrorResponse}
 */
export const uploadBase = (url:string, body:{}) => {
    // FormDataオブジェクトにAPIパラメタを格納する
    const formData = new FormData();
    for(const key in body){
        formData.append(key, body[key])
    };
    return fetch(
        url,
        {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
                // Content-Typeを指定するとAPI発行に失敗する
            }
        }
    ).then(
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
     * @param allAPIFuncSet setAllAPIFuncによってdataの全要素にWebAPIを発行する関数が付与されている場合はtrueを指定する
     */
    const ArrayCtor = function(this: any, data: TType[], allAPIFuncSet: boolean) {
        // NOTE: Arrow形式のコンストラクタ関数内ではthisを参照できない
        // NOTE: TypeScriptではコンストラクタ関数にはthis引数が必要のようだ
        // 
        // this: new ArrayCtor()で生成するオブジェクト
        Array.prototype.push.apply(this, data);
        // 生成するオブジェクトにallAPIFuncSetフラグを設定する
        this.__allAPIFuncSet = allAPIFuncSet;
    };

    // ArrayCtorはArrayオブジェクトを継承する
    // Object.create: 指定したプロトタイプオブジェクトを持つオブジェクトを生成する
    // NOTE: https://stackoverflow.com/questions/26630676
    ArrayCtor.prototype = Object.create(Array.prototype);
    ArrayCtor.prototype.constructor = ArrayCtor;

    // Datumのリストをイテレートして、WebAPIを発行する関数を付与する
    // こうすることで無駄にDatumのリストをイテレートするのを防ぐ
    const setAllAPIFunc = function(this: any) : TType[] {
        if(this.__allAPIFuncSet) {
            // 既に関数が付与済みの場合はWebAPIを付与しない
            // 無限呼び出しを防ぐためArrayCtor型からArray型に変換する
            return [...this];
        }else{
            // 未ラッパーの場合はラッパー処理を行う
            this.__allAPIFuncSet = true;

            // Arrayのmap関数に渡すコールバック関数
            const wrapCallbackfn = (datum: TType, index: number, array: TType[]) => {
                // オブジェクトに、WebAPIを発行する関数を付与する
                setAPIFunc(datum);
                return datum;
            };

            // Arrayのmapメソッドを、this=[ArrayCtorのインスタンス]で呼び出す
            // NOTE: TypeScriptにargumentsキーワードは存在しない
            return Array.prototype.map.apply(this, [wrapCallbackfn]) as TType[];
        }
    };

    // map関数をオーバーライドする
    ArrayCtor.prototype.map = function(callbackfn: (datum: TType, index: number, array: TType[]) => TType,
                                       thisArg?: any) : any {
        // this: new ArrayCtor()で生成するオブジェクト
        return new ArrayCtor(setAllAPIFunc.apply(this).map(callbackfn, thisArg), this.__allAPIFuncSet);
    };

    // find関数をオーバーライドする
    ArrayCtor.prototype.find = function(callbackfn: (value: TType, index: number, array: TType[]) => boolean,
                                        thisArg?: any) {
        // this: new ArrayCtor()で生成するオブジェクト
        return setAllAPIFunc.apply(this).find(callbackfn, thisArg);
    };

    // slice関数をオーバーライドする
    ArrayCtor.prototype.slice = function(start?: number, end?: number) {
        // this: new ArrayCtor()で生成するオブジェクト
        return new ArrayCtor(setAllAPIFunc.apply(this).slice(start, end), this.__allAPIFuncSet);
    };

    // shift関数をオーバーライドする
    ArrayCtor.prototype.shift = function() {
        // this: new ArrayCtor()で生成するオブジェクト
        return setAllAPIFunc.apply(this).shift();
    };

    // pop関数をオーバーライドする
    ArrayCtor.prototype.pop = function() {
        // this: new ArrayCtor()で生成するオブジェクト
        return setAllAPIFunc.apply(this).pop();
    };

    // filter関数をオーバーライドする
    ArrayCtor.prototype.filter = function(callbackfn: (value: TType, index: number, array: TType[]) => boolean,
                                          thisArg?: any) {
        // this: new ArrayCtor()で生成するオブジェクト
        return new ArrayCtor(setAllAPIFunc.apply(this).filter(callbackfn, thisArg), this.__allAPIFuncSet);
    };

    return ArrayCtor as any;
};
