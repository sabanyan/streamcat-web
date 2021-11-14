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

/**
 * Userを格納するオブジェクト型
 */
type NavigationUser = {
  uuid: string;
  email: string;
  name: string;
  state: string;
  creator: string;
  createdAt: string;
}

/**
 * Navigationを格納するオブジェクト型
 */
export type NavigationType = {
  allowlist: NavigationAllowlist;
  user: NavigationUser;
  version: string;
  depo_name: string;
}
