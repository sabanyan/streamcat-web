import {UserRole} from 'Types/index';
import Constants from 'Constants/index';
export default class AdminUtil {
    static getUserStatus = (status: string): string => {
        switch (status) {
            case Constants.admin.userStatus.active:
                return '利用中';
            case Constants.admin.userStatus.tmp:
                return '仮登録';
            case Constants.admin.userStatus.inactive:
                return '削除済';
        }
        return '';
    };

    static hasUserAdmin = (admin_types: [UserRole]):boolean =>{
       return !!(admin_types.find((role:UserRole)=>role.systemRole==Constants.admin.systemRole.USR_ADMIN))
    }

    static hasSystemAdmin = (admin_types: [UserRole]):boolean =>{
        return !!(admin_types.find((role:UserRole)=>role.systemRole==Constants.admin.systemRole.SYS_ADMIN))
    }

    static replaceAsterisk = (length: number): string => {
        const asteriskStr = [...Array(length)].map((index) => {return "*"});
        return asteriskStr.toString().replace(/,/g, '')
    }
}
