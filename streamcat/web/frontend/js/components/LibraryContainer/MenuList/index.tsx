import React from 'react';
import style from "./style.scss";
import { DatumType, FolderAllowlist, FolderType } from 'Model/Library'
import { CreateFolderButton } from 'Shared/Button/CreateFolderButton';
import { CreateRemoteFolderButton } from 'Shared/Button/CreateRemoteFolderButton';
import { CreateProjectButton } from 'Shared/Button/CreateProjectButton';
import { CreateFlowButton } from 'Shared/Button/CreateFlowButton';
import { CreateDatabaseButton } from 'Shared/Button/CreateDatabaseButton';
import { UploadFileButton } from 'Shared/Button/UploadFileButton';
import { UploadFlowButton } from 'Shared/Button/UploadFlowButton';
import { CreateScheduleButton } from 'Shared/Button/CreateScheduleButton';

type Props = {
    parent: FolderType;
    allowlist: FolderAllowlist;
    onSuccess: (newDatum:DatumType) => void;
}

export const MenuList = (props: Props) => {
    const { parent, allowlist, onSuccess: onSuccess } = props;

    let createFile: any, createFolder: any, createProject: any, upload: any, importProject: any

    createProject = allowlist.createProject ? <>
        <CreateProjectButton parent={parent} onSuccess={onSuccess} />
    </> : null;

    createFolder = allowlist.createFolder ? <>
        <CreateFolderButton parent={parent} onSuccess={onSuccess}/>
    </> : null;

    createFile = allowlist.createFile ? <>
        <CreateFlowButton parent={parent} onSuccess={onSuccess} />
        <CreateDatabaseButton parent={parent} onSuccess={onSuccess} />
        <CreateRemoteFolderButton parent={parent} onSuccess={onSuccess}/>
        <CreateScheduleButton parent={parent} onSuccess={onSuccess}/>
    </> : null;

    upload = allowlist.upload ? <>
        {/* ダミーとしてonSuccess()にparentを渡す */}
        <UploadFileButton parent={parent} onSuccess={()=>onSuccess(parent)} />
    </> : null;

    // 現状は、プロジェクト単位でインポートされる
    importProject = allowlist.import ? <>
        {/* ダミーとしてonSuccess()にparentを渡す */}
        <UploadFlowButton parent={parent} onSuccess={()=>onSuccess(parent)} />
    </> : null;

    return <div className={style.menuList}>
        {createProject}
        {createFolder}
        {createFile}
        {upload}
        {importProject}
    </div>;
};
