import Constants from 'Constants/index';
import { RoleType } from 'Model/Navigation/NavigationModel';
export default class AdminUtil {
    static getUserStatus = (status: string): string => {
        switch (status) {
            case Constants.admin.userStatus.active:
                return '利用中';
            case Constants.admin.userStatus.tmp:
                return '仮登録';
            case Constants.admin.userStatus.inactive:
                return '削除済';
            case Constants.admin.userStatus.expired:
                return '失効中';
        }
        return '';
    };

    static hasUserAdmin = (admin_types: RoleType[]):boolean =>{
       return !!(admin_types.find(role => role.systemRole==Constants.admin.systemRole.USR_ADMIN))
    }

    static hasSystemAdmin = (admin_types: RoleType[]):boolean =>{
        return !!(admin_types.find(role => role.systemRole==Constants.admin.systemRole.SYS_ADMIN))
    }

    static replaceAsterisk = (length: number): string => {
        const asteriskStr = [...Array(length)].map((index) => {return "*"});
        return asteriskStr.toString().replace(/,/g, '');
    }
}
