export default class WebUtil {
    static navigateURL(url: string) {
        window.location.href = url;
    }

    static webURL(url:string, isDialog=false): string {
        url = url.replace("./", "/");
        const args = isDialog? '?dialog=1': '';
        return window.location.protocol + "//" + window.location.host + url + args;
    }

    static setCloseWindowOnBack(){
        // ブラウザバックができるように履歴URLを一つ追加する
        history.pushState({closeWindow:true}, '', window.location.href);
        // 最後のpushStateが現在URLになる
        history.pushState({closeWindow:true}, '', window.location.href);
    
        // Chromeではセキュリティ対策として、
        // ページ読み込み直後にブラウザバックでのpopstateイベントが発火しない
        // クリックなどのユーザ操作の後であれば発火する
        // https://www.zdnet.com/article/google-working-on-blocking-back-button-hijacking-in-chrome/
        // window.addEventListener('popstate', () => {window.close()});
        window.addEventListener('popstate', (e) => {
            // Anchorタグの押下でもpopstateが発火するので
            // stateの値を見てウインドウを閉じるか判断する
            e.state && e.state.closeWindow && window.close();
        });
    }

    static logout(){
        const currentUrl = location.href;
        let logoutUrl: string;

        if(currentUrl.endsWith('#')){
            logoutUrl = currentUrl.slice(0, -1) + '?';
        }else if(currentUrl.includes('?')){
            logoutUrl = currentUrl + '&';
        }else{
            logoutUrl = currentUrl + '?';
        }

        WebUtil.navigateURL(logoutUrl + 'session=off');
    }
}
