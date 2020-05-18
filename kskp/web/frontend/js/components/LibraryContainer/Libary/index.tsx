import * as React from "react";
import {useEffect, useState} from "react";
import {ModalManager} from "Shared/Modal";
import {NotificationManager} from "Shared/Notification";
import {FileUploader, TextField} from "Shared/Input";
import {FileListTable} from "Components/LibraryContainer/Libary/FileListTable";
import {BreadCrumb, IBreadCrumbsLink} from "Components/LibraryContainer/Libary/BreadCrumb";
import Constants from "Constants/index";
import {APIUtil, ErrorUtil, HttpUtil, ModalUtil, ReactDomUtil, WebUtil, StringUtil} from "Utils/index";
import {EmptyState, Loader, Spacer} from "Shared/Base";
import {ITableBody} from "Components/LibraryContainer/Libary/FileListTable/FileListBody";
import {MenuList} from "Components/LibraryContainer/Libary/MenuList";
import {Flex} from "Shared/Base/Layouts/Flex";
import {useDispatch} from "react-redux";
import {addNotification, removeNotification} from "reapop";
import ParamsForm from "Shared/Inspector/ParamsForm";

interface Props {

}

export interface Database {
    label?: string;
    dbms?: any;
    host?: string;
    port?: string;
    database?: string;
    user_id?: string;
    user_password?: string;
}

const getDataBaseRules = () => {
    // TODO rulesの型定義
    const rules = {
        "label": {
            "presence": {"allowEmpty": false}
        },
        "dbms": {
            "presence": {"allowEmpty": false}
        },
        "hostname": {
            "presence": {"allowEmpty": false}
        },
        "port": {
            "presence": {"allowEmpty": false}
        }
    };
    return rules;
};
const getDataBaseParams = () => {
    // TODO paramsの型定義
    const params = [
        {
            "name": "label",
            "type": "string",
            "label": "Label"
        },
        {
            "name": "dbms",
            "type": "select",
            "label": "DBMS",
            "options": {
                "labels": ["PostgreSQL", "ORACLE"],
                "values": ["postgresql", "oracle"]
            },
            "default": "postgresql"
        },
        {
            "name": "host",
            "type": "string",
            "label": "ホスト名",
            "default": ""
        },
        {
            "name": "port",
            "type": "number",
            "label": "ポート番号",
            "default": ""
        },
        {
            "name": "database",
            "type": "string",
            "label": "データベース名",
            "default": ""
        },
        {
            "name": "user_id",
            "type": "string",
            "label": "ユーザID",
            "default": ""
        },
        {
            "name": "user_password",
            "type": "string",
            "label": "パスワード",
            "default": ""
        }
    ];

    return params;
};

const getInitialDatabase = (): Database => {
    return {
        label: "",
        dbms: getDataBaseParams()[1].default,
        host: "",
        port: "",
        database: "",
        user_id: "",
        user_password: ""
    };
};

const Library = (props: Props) => {

    const dispatch = useDispatch();
    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };

    const [formFlowName, setFormFlowName] = useState<string>("");
    const [formProjectName, setFormProjectName] = useState<string>("");
    const [formFolderName, setFormFolderName] = useState<string>("");
    const [database, setDatabase] = useState<Database | null>(getInitialDatabase());
    const [new_names, setNewNames] = useState();
    const [stores, setStores] = useState();
    const [libraryChildren, setLibraryChildren] = useState();
    const [folderPath, setFolderPath] = useState();
    const [isLoading, setIsLoading] = useState();
    const [is_finished, setIsFinished] = useState();
    const [isDialog, setIsDialog] = useState();

    const mode = HttpUtil.getURLParam("mode") ? HttpUtil.getURLParam("mode") : Constants.library.mode.list;

    const [links,setLinks] = useState<IBreadCrumbsLink[]>([]);

    useEffect(()=>{
        if(!folderPath)return;
        setLinks(makeBreadCrumbLinks(folderPath));
    },folderPath);

    const makeBreadCrumbLinks = (folderPath: any[]): IBreadCrumbsLink[]  =>{
        const dialogOption = (isDialog) ? '?dialog=true' : "";
        return folderPath.map((path, index):IBreadCrumbsLink => {
            const isCurrent =  ((folderPath.length - 1) === index);
            if(index === 0){
                // ルートはライブラリを指定
                return {
                    uuid: path.uuid,
                    label:"ライブラリ",
                    url: "/library"+ dialogOption,
                    current:isCurrent
                }
            }

            return {
                uuid: path.uuid,
                label: path.label,
                url: "/folders/" + path.uuid + dialogOption,
                current: isCurrent
            }
        });
    };

    const onClickAddDatabaseDone = ()=>{
        if (!database) return;
        try {
            if (!database.label) {
                alert("Labelを入力してください");
                return;
            }
            if (!database.dbms) {
                alert("DBMSを入力してください");
                return;
            }
            if (!database.host) {
                alert("ホスト名を入力してください");
                return;
            }
            if (!database.port) {
                alert("ポート名を入力してください");
                return;
            }

            const body = {
                label: database.label,
                parent: inject_folder_uuid,
                dbms: database.dbms,
                hostname: database.host,
                port: Number(database.port),
                database: database.database,
                user_id: database.user_id,
                password: database.user_password
            };
            APIUtil.post("databases", body).then((response) => {
                completeAddedDatabase(response);
            }, () => {
                unhandledNotify("データベース作成エラー");
            });
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.ADD_DATABASE, onClickDone: onClickAddDatabaseDone
        });
    }, []);

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.ADD_PROJECT, onClickDone: () => {
                APIUtil.post("projects", {name: formProjectName}).then((response) => {
                    ModalUtil.emitModal(
                        {id: Constants.modal.ADD_PROJECT, visible: false});
                    // this.clearKeyword()
                    // this.getProjectList()
                    fetchFolder();
                });
            }
        });
    }, [formProjectName]);

    useEffect(() => {
        // Folder
        ModalUtil.registerModal({
            id: Constants.modal.ADD_FOLDER, onClickDone: () => {
                if (formFolderName.length === 0) {
                    alert("ファルダ名を入力してください");
                    ModalUtil.closeModal(Constants.modal.ADD_FOLDER);
                    return;
                }
                setIsLoading(true);
                // TODO SelectedDataの扱い
                // this.setState({is_loading: true, selected_data: null});
                const body = {
                    "label": formFolderName,
                    "parent": inject_folder_uuid
                };
                APIUtil.post("folders", body).then((response) => {
                    completeAddedFolder(response);
                    setFormFolderName("");
                    ModalUtil.closeModal(Constants.modal.ADD_FOLDER);
                }, () => {
                    unhandledNotify("フォルダ作成エラー");
                });
            }
        });
    }, [formFolderName]);

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.ADD_FLOW, onClickDone: () => {
                if (!formFlowName) {
                    alert("フロー名を入力してください");
                    return false;
                }
                APIUtil.post("flows", {
                    name: formFlowName,
                    project_uuid: inject_project_uuid,
                    datasource: {
                        "type": "frame"
                    }
                }).then((response) => {
                    ModalUtil.closeModal(Constants.modal.ADD_FLOW);
                    // this.clearKeyword()
                    // this.getFlowList()
                    fetchFolder();
                });
                return true;
            }
        });
    }, [formFlowName]);


    /**
     * データベース作成後の完了処理
     * @param response
     */
    const completeAddedDatabase = (response: any) => {
        if(!database)return;
        const json = response.data.data;
        if (!response.data.success) {
            notify({
                title: "データベース作成エラー",
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
                status: "error",
                dismissAfter: 0,
                closeButton: true
            });
        } else {
            notify({
                title: "データベースを作成しました",
                message: database.label + "を作成しました",
                status: "success"
            });
        }
        setIsLoading(false);
        setDatabase(getInitialDatabase());
        ModalUtil.closeModal(Constants.modal.ADD_DATABASE);
        fetchFolder();
    };

    /**
     * ハンドリングできないエラー表示
     * @param title
     */
    const unhandledNotify = (title: string) => {
        setIsLoading(false);
        notify({
            title: title,
            message: Constants.errorMessage.unhandledError,
            status: "error",
            dismissAfter: 0,
            closeButton: true
        });
    };

    /**
     * フォルダ作成時の完了処理
     * @param response
     */
    const completeAddedFolder = (response: any) => {
        const json = response.data.data;
        setIsLoading(false);
        if (!response.data.success) {
            notify({
                title: "フォルダ作成エラー",
                message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
                status: "error",
                dismissAfter: 0,
                closeButton: true
            });
        } else {
            notify({
                title: "フォルダを作成しました",
                message: formFolderName + "を作成しました",
                status: "success"
            });
        }
        fetchFolder();
    };

    useEffect(() => {
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
                } else {
                    APIUtil.get("awss3s/" + inject_folder_uuid).then((response) => {
                        if (response.data.success) {
                            const json = response.data.data;
                            const {children, folderPath, inject_folder_uuid} = json;
                            setLibraryChildren(children);
                            setFolderPath(folderPath);
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
                }
            });
        }
    };

    const onClickNewFlow = () => {
        ModalUtil.emitModal({
            id: Constants.modal.ADD_FLOW,
            visible: true,
            done: "作成する",
            content: <div>
                <TextField placeholder={"フロー名"}
                           onChange={(e, validation) => setFormFlowName(e.target.value)} />
                <div className={"mt-8px"} />
            </div>
        });
    };
    const onClickNewProject = () => {
        ModalUtil.emitModal({
            id: Constants.modal.ADD_PROJECT,
            visible: true,
            done: "作成する",
            content: <TextField placeholder={"プロジェクト名"}
                                onChange={(e) => setFormProjectName(e.target.value)} />
        });
    };
    const onClickNewFolder = () => {
        ModalUtil.emitModal({
            id: Constants.modal.ADD_FOLDER,
            visible: true,
            done: "追加する",
            content: <div>
                <TextField placeholder={"フォルダ名"} onChange={(e) => setFormFolderName(e.target.value)} />
            </div>
        });
    };
    const onClickCSVUpload = () => {
        let url = location.protocol + "//" + location.host + "/api/v0/frames";
        ModalUtil.emitModal({
            id: Constants.modal.ADD_FRAME,
            visible: true,
            done: "アップロード",
            content: <div>
                <FileUploader accept={[".csv"]} url={url} parentUUID={inject_folder_uuid} notify={notify} />
            </div>
        });
    };

    const onClickAddDataSource = () => {
        console.log("ADD_DATABASE");
        const params = getDataBaseParams();
        let database: Database = {};
        params.map(param => {
            if (param.default) database[param.name] = param.default;
        });
        const paramsForm = <ParamsForm params={params} args={database} invalids={{}}
                                       onChange={onChangeDatabase} />;

        ModalUtil.emitModal({
            id: Constants.modal.ADD_DATABASE,
            visible: true,
            done: "追加する",
            dynamic: true,
            content: paramsForm
        });
        console.log(database);

        setDatabase(database);
    };


    const onChangeDatabase = (e: React.ChangeEvent<HTMLInputElement>, param, value) => {
        try {
            if (!database) return;
            let newDatabase = database;
            newDatabase[param.name] = value;
            setDatabase(newDatabase);
            const params = getDataBaseParams()
            const paramsForm = <ParamsForm params={params} args={database} invalids={{}} onChange={(e, param, value) => onChangeDatabase(e, param, value)}></ParamsForm>
            ModalUtil.emitModal({
                id: Constants.modal.ADD_DATABASE,
                visible: true,
                done: '追加する',
                dynamic: true,
                content: paramsForm,
            })
        } catch (e) {
            console.log(e);
        }
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


        const onClickFileName=(body: ITableBody)=>{

            // TODO ダイアログ表示された場合の選択時の対応
            // TODO ダイアログ表示された場合のゴミ箱や機能制限の対応

            if(body.type === "trash"){
                WebUtil.navigateURL(WebUtil.webURL("/trashes"));
            }
            if(body.type === "folder"){
                WebUtil.navigateURL(WebUtil.webURL("/folders/" + body.uuid));
            }
            if(body.type === "frame"){
                window.open(WebUtil.webURL('/preview?step_id=null&dialog=false&frame_uuid=' + body.uuid + '&title=' + StringUtil.urlEncode(body.label)));
            }

            console.log(body);

        };


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
                        onClickFileName={onClickFileName}
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

export {Library};
