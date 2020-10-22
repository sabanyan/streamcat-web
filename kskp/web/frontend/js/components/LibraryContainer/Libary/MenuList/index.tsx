import * as React from "react";
import * as style from "./style.scss";
import { Spacer } from "Shared/Base";
import { FlatButton } from "Shared/Input";

interface Props {
    allowlist: any;
    onClickNewFlow: () => void;
    onClickNewProject: () => void;
    onClickNewFolder: () => void;
    onClickCSVUpload: () => void;
    onClickAddDatabase: () => void;
}

const MenuList = (props: Props) => {
    const { allowlist, onClickNewFlow, onClickNewProject, onClickNewFolder, onClickCSVUpload, onClickAddDatabase } = props;

    let createMenu: any = null;
    let uploadMenu: any = null;

    createMenu = allowlist.create ? <React.Fragment>
        <FlatButton icon={"icon-add"} onClick={onClickNewFlow}>フローの新規作成</FlatButton>
        <Spacer height={8} />
        <FlatButton icon={"icon-add"} onClick={onClickNewProject}>プロジェクトの新規作成</FlatButton>
        <Spacer height={8} />
        <FlatButton icon={"icon-add"} onClick={onClickNewFolder}>フォルダの作成</FlatButton>
        <Spacer height={8} />
        <FlatButton icon={"icon-add"} onClick={onClickAddDatabase}>データベースの追加</FlatButton>
        <Spacer height={8} />
    </React.Fragment> : null;

    uploadMenu = allowlist.upload ? <React.Fragment>
        <FlatButton icon={"icon-upload"} onClick={onClickCSVUpload}>CSVファイルアップロード</FlatButton>
        <Spacer height={8} />
    </React.Fragment> : null;

    return <div className={style.menuList}>
        {createMenu}
        {uploadMenu}
    </div>;
};

export { MenuList };
