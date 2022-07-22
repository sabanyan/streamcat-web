import {UserType} from 'Model/Navigation/NavigationModel';
import {
    putBase,
    getBase as get,
    delBase as del,
    makeArrayCtor
} from './ApiUtilBase';

const put = (url: string, body: {}) => {
    return putBase<UserType>(url, body).then<UserType>(user => {
        // UserArrayのshift()を用いてuserに各種関数を付与する
        // NOTE: shift()は必ずUserオブジェクトを返す
        return user && (new UserArray([user])).shift() as UserType;
    });
};

/**
 * UserArrayのコンストラクタ関数を作成する
 */
const UserArray = makeArrayCtor<UserType>(user => {
    // 
    // Userオブジェクトに、WebAPIを発行する関数を付与する
    // 
    user.rename = (name) => 
        put(`/api/v0/users/${user.uuid}`, {name:name});
    user.updateEMail = (email) => 
        put(`/api/v0/users/${user.uuid}`, {email:email});
    user.updatePassword = (password) => 
        put(`/api/v0/users/${user.uuid}`, {password:password});
    user.resetPassword = () => 
        put(`/api/v0/users/${user.uuid}`, {password:null});
    user.undelete = () =>
        put(`/api/v0/users/${user.uuid}`, {state:'active'});
    user.delete = () =>
        del(`/api/v0/users/${user.uuid}`);
});

/**
 * Web APIを発行する関数を纏めるクラス
 */
export const UserApi = {
    /**
     * GET /usersを発行してUserを取得する
     * @throws {ErrorResponse}
     */
    findUsers: (q?: string, exceptInactive?:boolean, roles?: boolean, projects?: boolean):Promise<UserType[]>  => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {q?:string, except_inactive?:string, roles?:string, projects?:string} = {};
        q && (params.q = q);
        exceptInactive && (params.except_inactive = 'on');
        roles && (params.roles = 'on');
        projects && (params.projects = 'on');
        return get<UserType[]>('/api/v0/users', params).then(users => {
            return new UserArray(users);
        });
    }
};
