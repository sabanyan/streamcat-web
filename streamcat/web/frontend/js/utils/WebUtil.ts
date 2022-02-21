export default class WebUtil {
    static navigateURL(url: string) {
        window.location.href = url;
    }

    static webURL(url: string): string {
        url = url.replace("./", "/");
        return window.location.protocol + "//" + window.location.host + url;
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
