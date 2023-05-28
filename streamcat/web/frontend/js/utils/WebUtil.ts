export default class WebUtil {
    static navigateURL(url: string) {
        window.location.href = url;
    }

    static webURL(url: string): string {
        url = url.replace("./", "/");
        return window.location.protocol + "//" + window.location.host + url;
    }

    static setCloseWindowOnBack(){
        // ブラウザバックができるように履歴URLを一つ追加する
        history.pushState(null, '', window.location.href);
        // 最後のpushStateが現在URLになる
        history.pushState(null, '', window.location.href);
    
        // Chromeではセキュリティ対策として、
        // ページ読み込み直後にブラウザバックでのpopstateイベントが発火しない
        // クリックなどのユーザ操作の後であれば発火する
        // https://www.zdnet.com/article/google-working-on-blocking-back-button-hijacking-in-chrome/
        window.addEventListener('popstate', () => {window.close()});
    }

    static logout(){
        const currentUrl = location.href;
        let logoutUrl: string;

        if(currentUrl.endsWith('#')){
            logoutUrl = currentUrl.slice(0, -1) + '?';
        }else if(currentUrl.indexOf('?') !== -1){
            logoutUrl = currentUrl + '&';
        }else{
            logoutUrl = currentUrl + '?';
        }

        WebUtil.navigateURL(logoutUrl + 'session=off');
    }
}
