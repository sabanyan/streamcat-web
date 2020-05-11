import * as React from "react";
import {useEffect, useState} from "react";
import {ModalManager} from "Shared/Modal";
import {NotificationManager} from "Shared/Notification";
import {TextField} from "Shared/Input";
import {FileListTable} from "Components/LibraryContainer/Libary/FileListTable";
import {BreadCrumb, IBreadCrumbsLink} from "Components/LibraryContainer/Libary/BreadCrumb";
import Constants from "Constants/index";
import {APIUtil, HttpUtil, ModalUtil} from "Utils/index";
import {EmptyState, Loader, Spacer} from "Shared/Base";
import {ITableBody} from "Components/LibraryContainer/Libary/FileListTable/FileListBody";
import {MenuList} from "Components/LibraryContainer/Libary/MenuList";
import {Flex} from "Shared/Base/Layouts/Flex";

interface ContainerProps {
    notify: any;
    dismissNotify: any;
}

interface Props extends ContainerProps {

}

const Library = (props: Props) => {
    const {notify, dismissNotify} = props;

    const [projectName, setProjectName] = useState<string>("");
    const [stores, setStores] = useState();
    const [libraryChildren, setLibraryChildren] = useState();
    const [folderPath, setFolderPath] = useState();
    const [currentFolderUUID, setCurrentFolderUUID] = useState();
    const [isLoading, setIsLoading] = useState();
    const [is_finished, setIsFinished] = useState();

    const mode = HttpUtil.getURLParam("mode") ? HttpUtil.getURLParam("mode") : Constants.library.mode.list;

    const links: IBreadCrumbsLink[] = [{
        name: "ライブラリ",
        url: "/"
    }, {
        name: "project_test",
        url: "/"
    }];


    useEffect(() => {
        //モーダル処理の登録
        ModalUtil.registerModal({
            id: Constants.modal.ADD_PROJECT, onClickDone: () => {
                APIUtil.post("projects", {name: projectName}).then((response) => {
                    ModalUtil.emitModal(
                        {id: Constants.modal.ADD_PROJECT, visible: false});
                    // this.clearKeyword()
                    // this.getProjectList()
                });
            }
        });
        fetchFolder();

    }, []);


    const fetchFolder = () => {
        Promise.all([getStores(), getFolderChildren()]).then(() => {
            setIsLoading(false);
            setIsFinished(true);
        });
    };


    const getStores = () => {
        return APIUtil.get("stores").then((response) => {
            const json = response.data.data;
            setStores(json.stores);
        });
    };

    const getFolderChildren = () => {
        if (inject_folder_uuid) {
            //該当フォルダを取得
            return APIUtil.get("folders/" + inject_folder_uuid).then((response) => {
                if (response.data.success) {
                    const json = response.data.data;
                    const {children, folderPath, inject_folder_uuid} = json;
                    setLibraryChildren(children);
                    setFolderPath(folderPath);
                    setCurrentFolderUUID(inject_folder_uuid);
                } else {
                    APIUtil.get("awss3s/" + inject_folder_uuid).then((response) => {
                        if (response.data.success) {
                            const json = response.data.data;
                            const {children, folderPath, inject_folder_uuid} = json;
                            setLibraryChildren(children);
                            setFolderPath(folderPath);
                            setCurrentFolderUUID(inject_folder_uuid);
                        }
                    });
                }
            });
        } else {
            //ルートを取得
            return APIUtil.get("library").then((response) => {
                const json = response.data.data;
                if (response.data.success) {
                    const {children, folderPath, uuid} = json;
                    setLibraryChildren(children);
                    setFolderPath(folderPath);
                    setCurrentFolderUUID(uuid);
                }
            });
        }
    };

    const onClickNewFlow = () => {
        ModalUtil.emitModal({
            id: Constants.modal.ADD_PROJECT,
            visible: true,
            done: "削除する",
            danger: true,
            content: <div>
                選択されたステップを削除しますか？
            </div>
        });
    };
    const onClickNewProject = () => {
        ModalUtil.emitModal({
            id: Constants.modal.ADD_PROJECT,
            visible: true,
            done: "作成する",
            content: <TextField placeholder={"プロジェクト名"}
                                onChange={(e) => setProjectName(e.target.value)} />
        });
    };
    const onClickNewFolder = () => {

    };
    const onClickCSVUpload = () => {

    };
    const onClickAddDataSource = () => {

    };


    const isEmptyLibraryList = () => {
        if (!is_finished) {
            return false;
        }
        if (!Array.isArray(libraryChildren) ||
            libraryChildren.length === 0 || libraryChildren === null) {
            return true;
        }
        return false;
    };

    const renderAll = () => {
        if (!is_finished) return null;
        if (isEmptyLibraryList() && mode === Constants.library.mode.dialog) return renderEmptyState();

        // // 普通にライブラリーを開いた時
        // let newUI = <div>
        //     {this.renderNewFolder()}
        //     {/*{this.renderNewDocument()}*/}
        //     {this.renderNewFrame()}
        //     {this.renderNewDatabase()}
        // </div>;
        //
        // // 異動先選択など
        // let selectUI = <div>
        //     {this.renderSelectDestination()}
        // </div>;

        // TODO ソート（コメントアウト済み）
        // let list = this.state.libraryChildren.filter((libray) => libray.label.includes(this.state.searchText));
        // if (this.state.sortKey && this.state.sortOrder) {
        //     let sortKey: string = this.state.sortKey;
        //     let sortOrder: "asc" | "desc" = this.state.sortOrder;
        //     list = list.sort((a: LibraryChild, b: LibraryChild) => {
        //         if (sortOrder === "asc") {
        //             return (a[sortKey] < b[sortKey]) ? -1 : 1;
        //         } else {
        //             return (a[sortKey] < b[sortKey]) ? 1 : -1;
        //         }
        //     });
        // }

        console.log(libraryChildren);

        return <Flex justifyContent={"center"} fluid={true}>
            {/*{this.renderBreadCrumb()}*/}
            {/*{this.renderSearchBar()}*/}
            {/*<List<LibraryChild>*/}
            {/*    lists={list}*/}
            {/*    selected={this.state.selectedDatas}*/}
            {/*    getHeaders={this.getHeaders}*/}
            {/*    getColumns={this.getColumns}*/}
            {/*    onClickData={this.onClickLibrary}*/}
            {/*/>*/}
            {/*{this.renderInspector()}*/}
            {/*{(this.state.mode === Constants.library.mode.list) ? newUI : null}*/}
            {/*{(this.state.mode === Constants.library.mode.folder_select) ? selectUI : null}*/}


            <Flex flexDirection={"row"} width={1480 + 40 + 40} fluid={true}>
                <Spacer width={40} />
                <Flex flexDirection={"column"} fluid={true}>
                    <Spacer height={40} />
                    <BreadCrumb links={links} />
                    <Spacer height={8} />

                    <FileListTable
                        onClickCell={(body: ITableBody) => {
                            alert("cell");
                            console.log(body);
                        }}
                        onClickFileName={(body: ITableBody) => {
                            alert("file");
                            console.log(body);
                        }}
                        onClickHeader={() => {
                        }}
                        bodies={libraryChildren}

                    />
                </Flex>
                <Spacer width={40} />
                <Flex flexDirection={"column"} fluid={true} width={280}>
                    <Spacer height={160} />
                    <MenuList
                        onClickAddDataSource={onClickAddDataSource}
                        onClickCSVUpload={onClickCSVUpload}
                        onClickNewFlow={onClickNewFlow}
                        onClickNewFolder={onClickNewFolder}
                        onClickNewProject={onClickNewProject}
                    />
                </Flex>
                <Spacer width={40} />
            </Flex>
        </Flex>;
    };


    const renderEmptyState = () => {
        return <EmptyState
            icon={"inbox"}
            title={"ライブラリが空です"}
            description={"表示できるファイルがありません"}>
        </EmptyState>;
    };


    return <>
        <Loader center={true} absolute={true} visible={isLoading} />
        {renderAll()}

        <ModalManager
            notify={notify}
            dismissNotify={dismissNotify}
        />
        <NotificationManager />
    </>;

};

export default Library;
