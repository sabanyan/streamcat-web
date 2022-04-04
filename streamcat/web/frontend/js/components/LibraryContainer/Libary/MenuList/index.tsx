import React from 'react';
import * as style from "./style.scss";
import { Spacer } from "Shared/Base";
import { FolderAllowlist, FolderType } from 'Model/Library'
import { CreateFolderButton } from 'Components/LibraryContainer/CreateFolderButton';
import { CreateRemoteFolderButton } from 'Components/LibraryContainer/CreateRemoteFolderButton';
import { CreateProjectButton } from 'Components/LibraryContainer/CreateProjectButton';
import { CreateFlowButton } from 'Components/LibraryContainer/CreateFlowButton';
import { CreateDatabaseButton } from 'Components/LibraryContainer/CreateDatabaseButton';
import { UploadFileButton } from 'Components/LibraryContainer/UploadFileButton';
import { UploadFlowButton } from 'Components/LibraryContainer/UploadFlowButton';

interface Props {
    parent: FolderType;
    allowlist: FolderAllowlist;
    fetchFolder: () => void;
}

const MenuList = (props: Props) => {
    const { parent, allowlist, fetchFolder } = props;

    let createFile: any, createFolder: any, createProject: any, upload: any, importProject: any

    createProject = allowlist.createProject ? <>
        <CreateProjectButton parent={parent} onSuccess={fetchFolder} />
        <Spacer height={8} />
    </> : null;

    createFolder = allowlist.createFolder ? <>
        <CreateFolderButton parent={parent} onSuccess={fetchFolder}/>
        <Spacer height={8} />
    </> : null;

    createFile = allowlist.createFile ? <>
        <CreateFlowButton parent={parent} onSuccess={fetchFolder} />
        <Spacer height={8} />
        <CreateDatabaseButton parent={parent} onSuccess={fetchFolder} />
        <Spacer height={8} />
        <CreateRemoteFolderButton parent={parent} onSuccess={fetchFolder}/>
        <Spacer height={8} />
    </> : null;

    upload = allowlist.upload ? <>
        <UploadFileButton parent={parent} onSuccess={fetchFolder} />
        <Spacer height={8} />
    </> : null;

    // 現状は、プロジェクト単位でインポートされる
    importProject = allowlist.import ? <>
        <UploadFlowButton parent={parent} onSuccess={fetchFolder} />
        <Spacer height={8} />
    </> : null;

    return <div className={style.menuList}>
        {createProject}
        {createFolder}
        {createFile}
        {upload}
        {importProject}
    </div>;
};

export { MenuList };
