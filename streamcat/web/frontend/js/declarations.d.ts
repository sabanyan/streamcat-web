declare module "*.scss";

declare const inject_static_url: string;
declare const inject_project_uuid: string;
declare const inject_folder_uuid: string;
declare const inject_flow_uuid: string;
declare const inject_lock_interval: number;
declare const inject_is_project: boolean;
declare const inject_is_trash: boolean;

declare interface Window {
    nodes: {}
    emitter: any
    devToolsExtension: any
}
