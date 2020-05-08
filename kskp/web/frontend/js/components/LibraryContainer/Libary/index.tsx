import * as React from "react";
import {ModalManager} from "Shared/Modal";
import {NotificationManager} from "Shared/Notification";
import {Button, InputForm, TextField} from "Shared/Input";
import {FileListTable} from "Components/LibraryContainer/Libary/FileListTable";
import {BreadCrumb, IBreadCrumbsLink} from "Components/LibraryContainer/Libary/BreadCrumb";
import Constants from "Constants/index";
import {APIUtil, ModalUtil} from "Utils/index";
import {useState} from "react";

interface ContainerProps {
    notify: any;
    dismissNotify: any;
}

interface Props extends ContainerProps {

}

const Library = (props: Props) => {
    const {notify, dismissNotify} = props;
    
    const [projectName,setProjectName] = useState<string>("");
    
    
    const links: IBreadCrumbsLink[] = [{
        name: "ライブラリ",
        url: "/"
    }, {
        name: "project_test",
        url: "/"
    }];


    //モーダル処理の登録
    ModalUtil.registerModal({
        id: Constants.modal.ADD_PROJECT, onClickDone: () => {
            APIUtil.post('projects', {name: "new_project"}).then((response) => {
                ModalUtil.emitModal(
                    {id: Constants.modal.ADD_PROJECT, visible: false})
                // this.clearKeyword()
                // this.getProjectList()
            })
        },
    });
    
    
    const onClickNewFlow = ()=>{
        ModalUtil.emitModal({
            id: Constants.modal.ADD_PROJECT,
            visible: true,
            done: '削除する',
            danger: true,
            content: <div>
                選択されたステップを削除しますか？
            </div>,
        })
    };
    const onClickNewProject = ()=>{
        ModalUtil.emitModal({
            id: Constants.modal.ADD_PROJECT,
            visible: true,
            done: '作成する',
            content: <TextField  placeholder={'プロジェクト名'}
                            onChange={(e) => setProjectName(e.target.value)} />,
        })
    };
    const onClickNewFolder = ()=>{

    };
    const onClickCSVUpload = ()=>{

    };
    const onClickAddDataSource = ()=>{

    };
    
    return <>
        <BreadCrumb links={links} />
        <FileListTable onClickBody={()=>{}} onClickHeader={()=>{}}/>
        <Button onClick={onClickNewFlow}>フローの新規作成</Button>
        <Button onClick={onClickNewProject}>プロジェクトの新規作成</Button>
        <Button onClick={onClickNewFolder}>フォルダの作成</Button>
        <Button onClick={onClickCSVUpload}>CSVファイルアップロード</Button>
        <Button onClick={onClickAddDataSource}>データソースの追加</Button>

        <ModalManager
            notify={notify}
            dismissNotify={dismissNotify}
        />
        <NotificationManager />
    </>;

};

export default Library;
