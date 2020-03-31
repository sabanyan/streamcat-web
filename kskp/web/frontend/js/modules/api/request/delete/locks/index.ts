import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url, LockUUID } from "Modules/api/core/types/request";

type Props = Url & LockUUID & {
}
// Delete
export function locks(props: Props) {
    const url = (props.url) ? props.url : URL.DELETE.locks
    const result_url = url + '/' + props.lockUUID

    /*
     * Lockの解除はページから晴れるタイミング（unload、またはbeforeunloadイベント)で送られているが
     * 非同期のXMLHttpRequestの場合、ブラウザーにより無視される場合がある
     * なので、データを送信の信頼性を高めるためには、同期のXMLHttpRequestを送るかsendbeaconを使う必要がある
     * https://developer.mozilla.org/ja/docs/Web/API/Navigator/sendBeacon
     */
    return new Promise((resolve, reject) => { // API ModuleのmethodはPromiseを返すべき
        
        /*
        var xhr = new XMLHttpRequest();
        xhr.open("POST", result_url, false); // third parameter of `false` means synchronous
        xhr.onload = (event) => {
            resolve(xhr.response)
        }
        xhr.onerror = () => {
            reject(xhr.statusText)
        }
        xhr.send()
        */
       let result:boolean = navigator.sendBeacon(result_url)
        if (result) {
            resolve()
        } else { // sendBeaconのresultがfalseの場合、ブラウザー送信キューに入れなかった
            reject()
        }
    })
}