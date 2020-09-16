declare module "*.scss";

declare const inject_project_uuid: string;
declare const inject_flow_uuid: string;
declare const inject_static_url: string;
declare const inject_folder_uuid: string;
declare const inject_data_frame_uuid: string;
declare const inject_data_frame_id: string;
declare const inject_generate_data_frame: boolean;
declare const inject_user_id: string;
declare const inject_is_trash: boolean;
declare const inject_is_project: boolean;

declare interface Window {
    commands: {}
    visualizers: {}
    subflows: {}
    emitter: any
    devToolsExtension: any
    __REDUX_DEVTOOLS_EXTENSION__: any
}
