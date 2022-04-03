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

type RoleType = {
  uuid: string;
  name: string;
  systemRole: 'SYS_ADMIN' | 'USR_ADMIN' | 'EVERYONE' | 'EDIT_LOCK';
  creator: string;
  createdAt: string;
}

/**
 * Userを格納するオブジェクト型
 */
export type UserType = {
  uuid: string;
  email: string;
  name: string;
  state: 'tmp' | 'active' | 'inactive' | 'expired';
  creator: string;
  createdAt: string;
  roles?: RoleType[];
  projects?: ProjectType[];

  rename: (name:string) => Promise<UserType>;
  updateEMail: (email:string) => Promise<UserType>;
  updatePassword: (password?:string) => Promise<UserType>;
  undelete: () => Promise<UserType>;
  delete: () => Promise<void>;
}

/**
 * Navigationを格納するオブジェクト型
 */
export type NavigationType = {
  version: string;
  depoName: string;
  user: UserType;
  allowlist: NavigationAllowlist;
}
