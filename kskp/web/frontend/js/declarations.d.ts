declare module '*.scss'; 

declare const inject_project_uuid:string
declare const inject_flow_uuid:string

declare interface Window {
    commands: {}
    visualizers : {}
    subflows : {}
}
