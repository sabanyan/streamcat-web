export default class WebUtil {
    static navigateURL(url: string) {
        window.location.href = url;
    }

    static webURL(url: string): string {
        url = url.replace("./", "/");
        return window.location.protocol + "//" + window.location.host + url;
    }

    static logout(){
        let logoutParam = "?session=off";
        if (location.href.indexOf("?") !== -1) {
            logoutParam = logoutParam.replace("?", "&");
        }
        const url = location.href + logoutParam;
        WebUtil.navigateURL(url);
    }
}
