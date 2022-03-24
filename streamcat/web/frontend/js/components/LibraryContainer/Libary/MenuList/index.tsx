import React from 'react';
import * as style from "./style.scss";
import { Spacer } from "Shared/Base";
import { FlatButton } from "Shared/Input";
import { FolderAllowlist, FolderType } from 'Model/Library'
import { CreateFolderButton } from 'Components/LibraryContainer/CreateFolderButton';
import { CreateRemoteFolderButton } from 'Components/LibraryContainer/CreateRemoteFolderButton';

interface Props {
    parent: FolderType;
    allowlist: FolderAllowlist;
    fetchFolder: () => void;
    onClickNewFlow: () => void;
    onClickNewProject: () => void;
    onClickImportFlow: () => void;
    onClickCSVUpload: () => void;
    onClickAddDatabase: () => void;
}

const MenuList = (props: Props) => {
    const { parent, allowlist, fetchFolder, onClickNewFlow, onClickNewProject,
        onClickCSVUpload, onClickAddDatabase, onClickImportFlow } = props;

    let createFile: any, createFolder: any, createProject: any, upload: any, importProject: any

    createProject = allowlist.createProject ? <>
        <FlatButton icon={"icon-add"} onClick={onClickNewProject}>プロジェクトの追加</FlatButton>
        <Spacer height={8} />
    </> : null;

    // 現状は、プロジェクト単位でインポートされる
    importProject = allowlist.import ? <>
        <FlatButton icon={"icon-upload"} onClick={onClickImportFlow}>フローのアップロード</FlatButton>
        <Spacer height={8} />
    </> : null;

    createFolder = allowlist.createFolder ? <>
        <CreateFolderButton parent={parent} onSuccess={fetchFolder}/>
        <Spacer height={8} />
    </> : null;

    createFile = allowlist.createFile ? <>
        <FlatButton icon={"icon-add"} onClick={onClickNewFlow}>フローの追加</FlatButton>
        <Spacer height={8} />
        <FlatButton icon={"icon-add"} onClick={onClickAddDatabase}>データベースの追加</FlatButton>
        <Spacer height={8} />
        <CreateRemoteFolderButton parent={parent} onSuccess={fetchFolder}/>
        <Spacer height={8} />
    </> : null;

    upload = allowlist.upload ? <>
        <FlatButton icon={"icon-upload"} onClick={onClickCSVUpload}>ファイルアップロード</FlatButton>
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
