//@flow

class HttpUtil {
    config: {}

    constructor () {
        //default config
        this.config = {}
    }

    mergeConfig (config?: {}) {
        if (config) {
            return Object.assign(this.config, config);
        }else{
            return this.config;
        }
    }

    windowOpen (path: string, callBackApply: Function, option: string = 'width=1200,height=600') {
        window.open('/' + path, 'child', option)
        window['onCallbackApply'] = callBackApply
    }

    getURLParam (paramName: string) {
        const url_string = window.location.href;
        const url = new URL(url_string);
        return url.searchParams.get(paramName) || '';
    }
}

//Singleton
//ref:https://qiita.com/hkusu/items/d9ac2bd135e9e579e018
export default new HttpUtil()