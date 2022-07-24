import { ProjectType } from "Model/Library";

/**
 * Navigationのallowlist
 */
type NavigationAllowlist = {
    findUsers: boolean;
    createUser: boolean;
    updateUser: boolean;
    updateSelfUser: boolean;
    readUserPassword: boolean;
    deleteUser: boolean;
};

export type RoleType = {
    uuid: string;
    name: string;
    systemRole: 'SYS_ADMIN' | 'USR_ADMIN' | 'EVERYONE' | 'EDIT_LOCK';
    creator: string;
    createdAt: string;
};

/**
 * Userを格納するオブジェクト型
 */
type UserBaseType = {
  uuid: string;
  email: string;
  name: string;
  state: 'tmp' | 'active' | 'inactive' | 'expired';
  // 仮登録状態、かつ操作ユーザがユーザ管理者権限を持つ場合は仮パスワードも返す
  password?: string;
  creator: string;
  createdAt: string;
  roles?: RoleType[];
  projects?: ProjectType[];
};

export type UserType = UserBaseType & {
    rename: (name:string) => Promise<UserType>;
    updateEMail: (email:string) => Promise<UserType>;
    updatePassword: (password:string) => Promise<UserType>;
    resetPassword: () => Promise<UserType>;
    undelete: () => Promise<UserType>;
    delete: () => Promise<void>;
};

export type SelfUserType = UserBaseType & {
    rename: (name:string) => Promise<SelfUserType>;
    updateEMail: (email:string, currentPassword:string) => Promise<SelfUserType>;
    updatePassword: (password:string, currentPassword:string) => Promise<SelfUserType>;
};

/**
 * Navigationを格納するオブジェクト型
 */
export type NavigationType = {
    version: string;
    depoName: string;
    user: UserType;
    allowlist: NavigationAllowlist;
};
