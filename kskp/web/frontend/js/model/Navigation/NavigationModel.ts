export type Props = {
  user_id: string
  user_name: string
  project_uuid: string
  project_name: string
  flow_uuid: string
  flow_name: string
  user: NavigationUser
  allowlist: NavigationAllowList
  depo_name: string
}

export interface NavigationUser {
  uuid: string;
  email: string;
  name: string;
  state: string;
  creator: string;
  createdAt: string;
}

export interface NavigationAllowList {
  findUsers: boolean;
  createUser: boolean;
  updateUser: boolean;
  updateSelfUser: boolean;
  readUserPassword: boolean;
  deleteUser: boolean;
}

export default class NavigationModel {
  user_id: string
  user_name: string
  project_uuid: string
  project_name: string
  flow_uuid: string
  flow_name: string
  user: NavigationUser
  allowlist: NavigationAllowList
  depo_name: string
  constructor (props: Props) {
    this.user_id      = props.user_id
    this.user_name    = props.user_name
    this.project_uuid = props.project_uuid
    this.project_name = props.project_name
    this.flow_uuid    = props.flow_uuid
    this.flow_name    = props.flow_name
    this.user         = props.user
    this.allowlist    = props.allowlist
    this.depo_name    = props.depo_name
  }
}