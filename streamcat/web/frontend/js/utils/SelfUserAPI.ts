import {SelfUserType} from 'Model/Navigation/NavigationModel';
import {
    putBase,
    getBase as get,
    makeArrayCtor
} from 'Utils/APIUtilBase';

const put = (url: string, body: {}) => {
    return putBase<SelfUserType>(url, body).then<SelfUserType>(user => {
        // UserArrayのshift()を用いてuserに各種関数を付与する
        // NOTE: shift()は必ずSelfUserオブジェクトを返す
        return user && (new SelfUserArray([user])).shift() as SelfUserType;
    });
};

/**
 * SelfUserArrayのコンストラクタ関数を作成する
 */
const SelfUserArray = makeArrayCtor<SelfUserType>(user => {
    // 
    // SelfUserオブジェクトに、WebAPIを発行する関数を付与する
    // 
    user.rename = (name) => 
        put(`/api/v0/users/self`, {name:name});
    user.updateEMail = (email, currentPassword) => 
        put(`/api/v0/users/self`, {email:email, currentPassword:currentPassword});
    user.updatePassword = (password, currentPassword) => 
        put(`/api/v0/users/self`, {password:password, currentPassword:currentPassword});
});

/**
 * Web APIを発行する関数を纏めるクラス
 */
export class SelfUserAPI {
    /**
     * GET /users/selfを発行してログインUserを取得する
     * @throws {ErrorResponse}
     */
     static findSelfUser = (exceptInactive?:boolean, roles?: boolean, projects?: boolean) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {except_inactive?:string, roles?:string, projects?:string} = {};
        exceptInactive && (params.except_inactive = 'on');
        roles && (params.roles = 'on');
        projects && (params.projects = 'on');
        return get<SelfUserType>('/api/v0/users/self', params).then(user => {
            return new SelfUserArray([user]).shift() as SelfUserType;
        });
    };
}
