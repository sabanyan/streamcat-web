export interface FlowAllowList {
    copy: boolean;
    delete: boolean;
    download: boolean;
    execute: boolean;
    findMember: boolean;
    lock: boolean;
    move: boolean;
    read: boolean;
    update: boolean;
    updateMember: boolean;
}

export enum FlowEditModeValue {
    NotAllowed = 'NotAllowed',
    Editable = 'Editable',
    ReadOnlyUpdateDisabled = 'ReadOnlyUpdateDisabled',
    ReadOnlyLocked = 'ReadOnlyLocked'
}

export enum NetworkStatusValue {
    Offline = 'Offline',
    Online = 'Online',
    UnKnown = 'UnKnown'
}

export enum FlowExecuteModeValue {
    NotExecutable = 'NotExecutable',
    Executable = 'Executable',
}

export interface DatumAllowList {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    execute: boolean;
    upload: boolean;
    download: boolean;
    copy: boolean;
    move: boolean;
    lock: boolean;
    findMember: boolean;
    updateMember: boolean;
}
