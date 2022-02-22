import React from 'react';
import * as style from "./style.scss";
import { Spacer } from "Shared/Base";
import { FlatButton } from "Shared/Input";
import { FolderAllowlist } from 'Model/Library'

interface Props {
    allowlist: FolderAllowlist;
    onClickNewFlow: () => void;
    onClickNewProject: () => void;
    onClickImportFlow: () => void;
    onClickNewFolder: () => void;
    onClickCSVUpload: () => void;
    onClickAddDatabase: () => void;
    onClickAddRemoteFolder: () => void;
}

const MenuList = (props: Props) => {
    const { allowlist, onClickNewFlow, onClickNewProject, onClickNewFolder,
        onClickCSVUpload, onClickAddDatabase, onClickAddRemoteFolder, onClickImportFlow } = props;

    let createFile: any, createFolder: any, createProject: any, upload: any, importProject: any

    createProject = allowlist.createProject ? <React.Fragment>
        <FlatButton icon={"icon-add"} onClick={onClickNewProject}>プロジェクトの追加</FlatButton>
        <Spacer height={8} />
    </React.Fragment> : null;

    // 現状は、プロジェクト単位でインポートされる
    importProject = allowlist.import ? <React.Fragment>
        <FlatButton icon={"icon-upload"} onClick={onClickImportFlow}>フローのアップロード</FlatButton>
        <Spacer height={8} />
    </React.Fragment> : null;

    createFolder = allowlist.createFolder ? <React.Fragment>
        <FlatButton icon={"icon-add"} onClick={onClickNewFolder}>フォルダの追加</FlatButton>
        <Spacer height={8} />
    </React.Fragment> : null;

    createFile = allowlist.createFile ? <React.Fragment>
        <FlatButton icon={"icon-add"} onClick={onClickNewFlow}>フローの追加</FlatButton>
        <Spacer height={8} />
        <FlatButton icon={"icon-add"} onClick={onClickAddDatabase}>データベースの追加</FlatButton>
        <Spacer height={8} />
        <FlatButton icon={"icon-add"} onClick={onClickAddRemoteFolder}>リモートフォルダの追加</FlatButton>
        <Spacer height={8} />
    </React.Fragment> : null;

    upload = allowlist.upload ? <React.Fragment>
        <FlatButton icon={"icon-upload"} onClick={onClickCSVUpload}>ファイルアップロード</FlatButton>
        <Spacer height={8} />
    </React.Fragment> : null;

    return <div className={style.menuList}>
        {createProject}
        {createFolder}
        {createFile}
        {upload}
        {importProject}
    </div>;
};

export { MenuList };
