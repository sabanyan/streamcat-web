export type Props = {
  flow_name: string;
  flow_uuid: string;
  project_name: string;
  project_uuid: string;
  user_id: string;
  user_name: string;
}

export default class NavigationModel {
  flow_name: string
  flow_uuid: string
  project_name: string
  project_uuid: string
  user_id: string
  user_name: string

  constructor (props: Props) {
    this.flow_name    = props.flow_name
    this.flow_uuid    = props.flow_uuid
    this.project_name = props.project_name
    this.project_uuid = props.project_uuid
    this.user_id      = props.user_id
    this.user_name    = props.user_name
  }
}