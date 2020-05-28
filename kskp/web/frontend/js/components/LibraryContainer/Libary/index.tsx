import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {ModalManager} from "Shared/Modal";
import {NotificationManager} from "Shared/Notification";
import {FileUploader, TextField} from "Shared/Input";
import {FileListTable} from "Components/LibraryContainer/Libary/FileListTable";
import {BreadCrumb, IBreadCrumbsLink} from "Components/LibraryContainer/Libary/BreadCrumb";
import Constants from "Constants/index";
import {APIUtil, ErrorUtil, HttpUtil, ModalUtil, ReactDomUtil, StringUtil, WebUtil} from "Utils/index";
import {EmptyState, Loader, Spacer} from "Shared/Base";
import {ITableBody} from "Components/LibraryContainer/Libary/FileListTable/FileListBody";
import {MenuList} from "Components/LibraryContainer/Libary/MenuList";
import {Flex} from "Shared/Base/Layouts/Flex";
import {useDispatch} from "react-redux";
import {addNotification, removeNotification} from "reapop";
import ParamsForm from "Shared/Inspector/ParamsForm";
import {ITableHeader} from "Components/LibraryContainer/Libary/FileListTable/FileListHeader";
import {LibraryChild} from "Model/Library";
import LibraryInspector from "Shared/Inspector/LibraryInspector";
import {LibraryModel, LocksModel, MessageModel, VisualizeModel} from "Model/index";
import {LibraryListDataType} from "Types/index";
import _ from "lodash";
import Queue from "promise-queue-plus";
import {API} from "Modules/api";
import {TrashMenuList} from "Components/LibraryContainer/Libary/TrashMenuList";
import axios from "axios";
import TrashInspector from "Shared/Inspector/TrashInspector";
import {ApplyMenuList} from "Components/LibraryContainer/Libary/ApplyMenuList";

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

export const getDataBaseRules = () => {
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
export const getDataBaseParams = () => {
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
    const [edit_database,setEditDatabase] = useState<Database | null>(getInitialDatabase);

    const [new_names, setNewNames] = useState();
    const [stores, setStores] = useState();
    const [libraryChildren, setLibraryChildren] = useState<LibraryListDataType[]>([]);
    const [initialLibraryChildren, setInitialLibraryChildren] = useState<LibraryListDataType[]>([]);


    const [selectedDatas, setSelectedDatas] = useState<LibraryChild[]>([]);
    const [lastSelected, setLastSelected] = useState<LibraryChild | null>(null);
    const [visualizers, setVisualizers] = useState<VisualizeModel[]>([]);

    const clickedLibraryCell = useRef(false);

    const [folderPath, setFolderPath] = useState();
    const [isLoading, setIsLoading] = useState();
    const [is_finished, setIsFinished] = useState();
    const [isDialog, setIsDialog] = useState((HttpUtil.getURLParam("dialog")) ? true : false);
    const [mode, setMode] = useState(HttpUtil.getURLParam("mode") ? HttpUtil.getURLParam("mode") : Constants.library.mode.list);
    const isProject = HttpUtil.getURLParam("project") ? HttpUtil.getURLParam("project") : false;

    const [links,setLinks] = useState<IBreadCrumbsLink[]>([]);

    // const [beforeSelected, setBeforeSelected] = useState();
    // useEffect(()=>{
    //         // 選択状態がかわったときに選択状態をクリアする
    //     console.log("lastSelected", lastSelected);
    //     console.log("selectedDats", selectedDatas);
    //     console.log("beforeSelected", beforeSelected);
    //     if(lastSelected && beforeSelected){
    //         if (lastSelected.uuid != beforeSelected.uuid){
    //         }
    //     }
    //     setBeforeSelected(lastSelected);
    // },[lastSelected]);

    useEffect(()=>{
        if(isDialog){
            const bodyEl = document.querySelector("body");
            if(bodyEl)bodyEl.classList.add('dialog');
        }
    },[isDialog]);

    useEffect(()=>{
        if(!folderPath)return;
        setLinks(makeBreadCrumbLinks(folderPath));
    },folderPath);

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.ADD_DATABASE, onClickDone: onClickAddDatabaseDone
        });
    }, []);

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.ADD_FRAME, onClickClose: onClickAddFrameDone
        });
    }, []);

    useEffect(() => {
        getVisualizers();
    }, []);

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.ADD_PROJECT, onClickDone: () => {
                APIUtil.post("projects", {name: formProjectName,parent: inject_folder_uuid}).then((response) => {
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
                    fetchFolder();
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
                    project_uuid: inject_folder_uuid, // TODO project_uuid のキーが将来的に変更になる可能性あり、実態はfolderのuuidが利用できる
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

    useEffect(() => {
        fetchFolder();
    }, []);

    const getVisualizers = ()=> {
        // window.visualizersに保存していたはずのvisualizersがなくなる場合があるため、再取得
        APIUtil.get("visualizers").then((response) => {
            const json = response.data;
            const visualizers = json.data.map((visualize) => {
                return new VisualizeModel(visualize);
            });
            setVisualizers(visualizers);
        });
    };
    const makeBreadCrumbLinks = (folderPath: any[]): IBreadCrumbsLink[]  =>{
        const dialogOption = (isDialog) ? '?dialog=true' + ((mode) ? "&mode=" + mode : ""):"";
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

    const onClickAddFrameDone = ()=>{
        fetchFolder();
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

    const clearSelected = ()=>{
        setLibraryChildren(libraryChildren.map((libraryChildren:LibraryListDataType)=>{
            libraryChildren.selected = false;
            return libraryChildren
        }));
    };

    const getFolderChildren = () => {
        if (inject_folder_uuid) {
            if (isProject) {
                return APIUtil.get("projects/" + inject_folder_uuid).then((response) => {
                    const json = response.data.data;
                    const {children, folderPath} = json;
                    setInitialLibraryChildren(children);
                    setLibraryChildren(children);
                    setFolderPath(folderPath);
                });
            }
            //該当フォルダを取得
            return APIUtil.get("folders/" + inject_folder_uuid).then((response) => {
                if (response.data.success) {
                    const json = response.data.data;
                    const {children, folderPath, inject_folder_uuid} = json;
                    setInitialLibraryChildren(children);
                    setLibraryChildren(children);
                    setFolderPath(folderPath);
                } else {
                    APIUtil.get("awss3s/" + inject_folder_uuid).then((response) => {
                        if (response.data.success) {
                            const json = response.data.data;
                            const {children, folderPath, inject_folder_uuid} = json;
                            setInitialLibraryChildren(children);
                            setLibraryChildren(children);
                            setFolderPath(folderPath);
                        }
                    });
                }
            });
        } else if (inject_is_trash){
          // ゴミ箱の場合
            return new Promise(async (resolve, reject) => {
                await API.request.doGet.trashes({})
                    .then((response) => {
                        if (response.data.data) {
                            let model = new LibraryModel(response.data.data);
                            setInitialLibraryChildren(model.children);
                            setLibraryChildren(model.children);
                            setFolderPath(model.folderPath);
                        } else {
                            throw response.data;
                        }
                    })
                    .catch((e) => {
                        console.log(e);
                        notify({
                            title: "エラー",
                            message: e.message,
                            status: "error",
                            dismissAfter: 0,
                            closeButton: true
                        });
                    });
                resolve();
            })
        } else {
            //ルートを取得
            return APIUtil.get("library").then((response) => {
                const json = response.data.data;
                if (response.data.success) {
                    const {children, folderPath, uuid} = json;
                    setInitialLibraryChildren(children);
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

    const onClickSelectDestination = () => {
        if (window.opener || !window.opener.closed) {
            window.opener.onCallbackApply(inject_folder_uuid);
        }
        window.close();
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

        const onClickFileName=(body: ITableBody)=>{
            const dialogOption = (isDialog) ? '?dialog=true' + ((mode) ? "&mode=" + mode : ""):"";
            // TODO ダイアログ表示された場合の選択時の対応
            // TODO ダイアログ表示された場合のゴミ箱や機能制限の対応

            if(body.type === "trash"){
                WebUtil.navigateURL(WebUtil.webURL("/trashes" + dialogOption));
            }
            if(body.type === "folder"){
                WebUtil.navigateURL(WebUtil.webURL("/folders/" + body.uuid + dialogOption));
            }
            if(body.type === "project"){
                WebUtil.navigateURL(WebUtil.webURL("/folders/" + body.uuid + dialogOption + "&project=true" ));
            }
            if(body.type === "frame"){
                // TODO データフレームがクリックされた場合どうするか
                window.open(WebUtil.webURL('/preview?step_id=null&dialog=false&frame_uuid=' + body.uuid + '&title=' + StringUtil.urlEncode(body.label)));
            }
            if(body.type === "flow"){
                WebUtil.navigateURL(WebUtil.webURL('/flows/' + body.uuid + + dialogOption));
            }

        };

        const onClickCell = (cell: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>): void => {
            //     // クリックされたデータを１番目の位置にする
            //     let selectedDatas: LibraryChild[] = this.state.selectedDatas
            // let lastSelected: LibraryChild | null = this.state.lastSelected

            let data: LibraryListDataType = cell;
            if (event && (event.metaKey || event.ctrlKey)) {
                data.selected = true;
                // command or ctrl + click
                if (selectedDatas.includes(data)) {
                    data.selected = !data.selected;
                    setSelectedDatas(selectedDatas.filter(d => d.uuid !== data.uuid));
                } else {
                    selectedDatas.push(data);
                }
            } else if (event && event.shiftKey) {
                // shift + click
                let current = libraryChildren.indexOf(data);
                if (lastSelected) {
                    let last = libraryChildren.indexOf(lastSelected);
                    let min, max;
                    if (current >= last) {
                        min = last;
                        max = current;
                    } else {
                        min = current;
                        max = last;
                    }
                    // TODO シフトキーによる複数選択
                    const selectedDatas:LibraryListDataType[] = libraryChildren.slice(min, max + 1).map((libraryChild)=>{
                        libraryChild.selected = !libraryChild.selected;
                    });
                    setSelectedDatas(selectedDatas);
                }
            } else {
                // 単一選択
                clearSelected();// 選択状態を一旦解除
                data.selected = true;
                if (selectedDatas.includes(data)) {
                    setSelectedDatas([]);
                } else {
                    setSelectedDatas([data]);
                }
            }
            setLastSelected(data);
            //TODO 単一選択がうごかなかったのでコメントアウト
            //setSelectedDatas(selectedDatas);
            clickedLibraryCell.current = true;
        };

        const onClickLibrary = () => {
            setTimeout(()=>{
                if(!clickedLibraryCell.current){
                    clearSelected();// 選択状態を一旦解除
                    setLastSelected(null);
                }
                clickedLibraryCell.current = false;
            },300);
        };

        const onClickDeleteAll = ()=>{
            onClickCleanTrash()
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
            {
                (!inject_is_trash)?
                    renderLibraryInspector()
                    :
                    renderTrashInspector()

            }
            {/*{(this.state.mode === Constants.library.mode.list) ? newUI : null}*/}
            {/*{(this.state.mode === Constants.library.mode.folder_select) ? selectUI : null}*/}
            <Flex flexDirection={"row"} width={1480 + 40 + 40} minHeight={"calc(100vh - 64px)"} fluid={true} onClick={onClickLibrary}>
                <Spacer width={40} />
                <Flex flexDirection={"column"} fluid={true}>
                    <Spacer height={40} />
                    <BreadCrumb links={links} />
                    <Spacer height={8} />
                    <FileListTable
                        minWidth={800}
                        onClickCell={onClickCell}
                        onClickFileName={onClickFileName}
                        onClickHeader={(header:ITableHeader) => {
                            if(header.sort){
                                setLibraryChildren(_.orderBy(libraryChildren, header.key, header.sort));
                            }else{
                                setLibraryChildren(initialLibraryChildren);
                            }
                        }}
                        bodies={libraryChildren}
                    />
                    <Spacer height={80} />
                </Flex>
                <Spacer minWidth={40} />
                <Flex flexDirection={"column"} fluid={true} width={280}>
                    <Spacer height={160} />
                    {(mode === Constants.library.mode.folder_select) ?
                        <ApplyMenuList
                            onClickApply={onClickSelectDestination}
                        />
                        :
                        (!inject_is_trash) ?
                            <MenuList
                                onClickAddDataSource={onClickAddDataSource}
                                onClickCSVUpload={onClickCSVUpload}
                                onClickNewFlow={onClickNewFlow}
                                onClickNewFolder={onClickNewFolder}
                                onClickNewProject={onClickNewProject}
                            />
                            :
                            <TrashMenuList
                                onClickDeleteAll={onClickDeleteAll}
                            />
                    }
                </Flex>
                <Spacer width={40} />
            </Flex>
        </Flex>;
    };

    const deleteLibrary = async (library: LibraryChild, lock: { uuid: string | null }) => {

        return new Promise(async (resolve, reject) => {
            // Lockが必要なライブラリー(flow)の場合は、Lockを取得する
            if (library.type === Constants.library.type.flow) {
                await API.request.doPost.locks({flowUUID: library.uuid})
                    .then((res) => {
                        if (!res.data.success) throw res.data;
                        lock.uuid = API.response.post.locks(res).uuid;
                    })
                    .catch((e) => {
                        console.log(e);
                        reject(e);
                    });
            }

            // Libraryを削除する
            await API.request.doDelete.library({
                libraryUUID: library.uuid,
                libraryType: library.type,
                lockUUID: lock.uuid
            })
                .then((res) => {
                    if (!res.data.success) throw res.data;
                })
                .catch((e) => {
                    console.log(e);
                    reject(e);
                });

            // Lockを取得した場合、Lockを解除する
            if (lock.uuid) {
                await API.request.doDelete.locks({lockUUID: lock.uuid})
                    .then((res: any) => {
                        lock.uuid = null;
                        if (!res.data.success) throw res.data;
                    })
                    .catch((e) => {
                        console.log(e);
                        reject(e);
                    });
            }
            resolve();
        })
            .then(() => {
                // 成功
                notify({
                    title: "",
                    message: library.label + "を削除しました",
                    status: "success"
                });
            })
            .catch((e) => {
                // エラー
                notify({
                    title: "ライブラリー削除エラー(" + library.label + ")",
                    message: e.message,
                    status: "error",
                    dismissAfter: 0,
                    closeButton: true
                });
            });
    };

    const moveLibrary = async (library: LibraryChild, parentFolderUUID: string, lock: { uuid: string | null }) => {

        return new Promise(async (resolve, reject) => {
            // Lockが必要なライブラリー(flow)の場合は、Lockを取得する
            if (library.type === Constants.library.type.flow) {
                await API.request.doPost.locks({flowUUID: library.uuid})
                    .then((res) => {
                        if (!res.data.success) throw res.data;
                        lock.uuid = API.response.post.locks(res).uuid;
                    })
                    .catch((e) => {
                        console.log(library);
                        console.log(e);
                        reject(e);
                    });
            }

            // Libraryを移動させる
            await API.request.doPut.library({
                parentUUID: parentFolderUUID,
                libraryUUID: library.uuid,
                libraryType: library.type,
                lockUUID: lock.uuid
            })
                .then((res) => {
                    if (!res.data.success) throw res.data;
                })
                .catch((e) => {
                    console.log(library);
                    console.log(e);
                    reject(e);
                });

            // Lockを取得した場合、Lockを解除する
            if (lock.uuid) {
                await API.request.doDelete.locks({lockUUID: lock.uuid})
                    .then((res: any) => {
                        lock.uuid = null;
                        if (!res.data.success) throw res.data;
                    })
                    .catch((e) => {
                        console.log(library);
                        console.log(e);
                        reject(e);
                    });
            }
            resolve();
        })
            .then(() => {
                // 成功
            })
            .catch((e) => {
                // 例外
                notify({
                    title: "ライブラリー移動エラー(" + library.label + ")",
                    message: e.message,
                    status: "error",
                    dismissAfter: 0,
                    closeButton: true
                });
            });
    };

    const renderTrashInspector = (): React.ReactNode => {
        if (!lastSelected) return null;
        clickedLibraryCell.current = true;
        const data: LibraryListDataType = lastSelected;

        const doRecovery = (data) => {
            API.request.doPut.trash({trashUUID: data.uuid})
                .then((response) => {
                    if (!response.data.success) throw response.data;

                })
                .catch((err) => {
                    let message = new MessageModel(err);
                    notify({
                        title: message.title,
                        message: message.message,
                        status: message.messageStatus,
                        dismissAfter: 0,
                        closeButton: true
                    });
                })
                .then(() => {
                    fetchFolder();
                });
        };

        const onClickRecovery = (e, data) => {
            ModalUtil.registerModal({
                id: Constants.modal.CONFIRM, onClickDone: () => {
                    doRecovery(data);
                    ModalUtil.closeModal(Constants.modal.CONFIRM);
                }
            });
            ModalUtil.emitModal({
                id: Constants.modal.CONFIRM,
                visible: true,
                done: "戻す",
                danger: true,
                content: <div>
                    {data.label} を元の場所に戻しますか？
                </div>
            });
        };

        const editFlow = (flow_uuid, parent_uuid) => {
            let body = {target: flow_uuid};
            let locks = new LocksModel(flow_uuid);

            return axios.post("/api/v0/locks", body).then((response) => {
                let locksModel = locks.Parse(response);
                let lockId = locksModel.getLockId();
                if (lockId) {
                    axios.put("/api/v0/flows/" + flow_uuid, {
                        parent: parent_uuid,
                        lock: lockId
                    }).then((response) => {
                        navigator.sendBeacon("/api/v0/delete-locks/" + lockId);
                    }, (error) => {
                        navigator.sendBeacon("/api/v0/delete-locks/" + lockId);
                        console.log(error);
                    });
                } else {
                    // lockが出来なかった場合
                    notify({
                        title: "ライブラリー移動エラー",
                        message: response.data.message,
                        status: "error",
                        dismissAfter: 0,
                        closeButton: true
                    });
                }
            });
        };

        const onClickMove = (e, libraryData: any) => {
            HttpUtil.windowOpen("library?dialog=true&mode=folder_select", (folder_uuid) => {
                const type = libraryData.type;
                const uuid = libraryData.uuid;
                const data = {
                    parent: folder_uuid
                };

                let result;
                switch (type) {
                    case Constants.library.type.folder:
                        result = APIUtil.put("folders/" + uuid, data);
                        break;
                    case Constants.library.type.flow:
                        result = editFlow(uuid, folder_uuid);
                        break;
                    case Constants.library.type.frame:
                        result = APIUtil.put("frames/" + uuid, data);
                        break;
                    case Constants.library.type.document:
                        result = APIUtil.put("documents/" + uuid, data);
                        break;
                    case Constants.library.type.database:
                        result = APIUtil.put("databases/" + uuid, data);
                        break;
                    case Constants.library.type.remoteFolder:
                        result = APIUtil.put("remote-folders/" + uuid, data);
                        break;
                }
                if (!result) return;
                result.then((response) => {
                    fetchFolder();
                    if (!response.data.success) {
                        notify({
                            title: "エラー",
                            message: response.data.message,
                            status: "error",
                            dismissAfter: 0,
                            closeButton: true
                        });
                    }
                });

            });
        };

        return <TrashInspector data={data}
                               onClickRecovery={(e, data) => onClickRecovery(e, data)}
                               onClickMove={(e, data) => onClickMove(e, data)}
        />;
    };

    const onClickCleanTrash = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                APIUtil.delete("trashes").then((response) => {
                    if (response.data.success !== true) throw response.data;
                    fetchFolder();
                }).catch(e => {
                    notify({
                        title: "ゴミ箱エラー",
                        message: e.message,
                        status: "error",
                        dismissAfter: 0,
                        closeButton: true
                    });
                });
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "ゴミ箱を空にする",
            danger: true,
            content: <div>
                ゴミ箱を空にしますか？
            </div>
        });
    };

    const renderLibraryInspector = (): React.ReactNode => {
        if (!lastSelected) return null;

        clickedLibraryCell.current = true;

        const data: LibraryListDataType = lastSelected;
        let _onClickApply: any = null;
        let _onClickEdit: any = null;
        let _onClickCleanTrash: any = null;
        let _onClickDelete: any = null;
        let _onClickMove: any = null;
        let _onClickEditEncoding: any = null;

        const onClickMove = () => {
            let queue = Queue(
                1, // concurrency
                {
                    "retry": 0               //Number of retries
                    , "retryIsJump": false     //retry now?
                    , "timeout": 0            //The timeout period
                }
            );
            let lock = {uuid: null};
            HttpUtil.windowOpen("library?dialog=true&mode=folder_select", (folder_uuid) => {
                setIsLoading(true);

                selectedDatas.forEach((selectedData: LibraryChild) => {
                    queue.push(moveLibrary, [selectedData, folder_uuid, lock]);
                });
                queue.push(setIsLoading, [false]);
                queue.push(fetchFolder, []);
                queue.start();
            });
        };

        const onClickEditDatabase = (data: LibraryListDataType) => {
            if (data.type !== Constants.library.type.database) {
                return;
            }
            const rules = getDataBaseRules();
            const params = getDataBaseParams();
            const newDatabase = {
                "label": data.label,
                "dbms": data.dbms,
                "host": data.hostname,
                "port": data.port,
                "database": data.database,
                "user_id": data.user_id,
                "user_password": data.password
            };
            setDatabase(newDatabase);

            const completeEditDatabase = (response: any) => {
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
                        title: "データベースを編集しました", message: (database) ? database.label : "" + "を編集しました",
                        status: "success"
                    });
                }
                setIsLoading(false);
                setEditDatabase(getInitialDatabase());
                ModalUtil.closeModal(Constants.modal.EDIT_DATABASE);
                fetchFolder();

            };

            const editLibraryChild = (data: LibraryListDataType) => {
                APIUtil.put("databases/" + data.uuid, newDatabase).then((response) => {
                    completeEditDatabase(response);
                }, () => {
                    unhandledNotify("データベース修正エラー");
                });
            };

            const onChangeEditDatabase = (e, param, value) => {
                try {
                    const newDatabase = database;
                    if (newDatabase) {
                        newDatabase[param.name] = value;
                        setDatabase(newDatabase);
                        const params = getDataBaseParams();
                        const paramsForm = <ParamsForm params={params} args={newDatabase} invalids={{}}
                                                       onChange={(e, param, value) => onChangeEditDatabase(e, param, value)} />;
                        ModalUtil.emitModal({
                            id: Constants.modal.EDIT_DATABASE,
                            visible: true,
                            done: "編集する",
                            danger: true,
                            content: paramsForm
                        });
                    }
                } catch (e) {
                    console.log(e);
                }
            };

            const paramsForm = <ParamsForm params={params} args={newDatabase} invalids={{}}
                                           onChange={(e, param, value) => onChangeEditDatabase(e, param, value)} />;
            ModalUtil.registerModal({
                id: Constants.modal.EDIT_DATABASE, onClickDone: () => {
                    editLibraryChild(data);
                    ModalUtil.closeModal(Constants.modal.CONFIRM);
                }
            });
            ModalUtil.emitModal({
                id: Constants.modal.EDIT_DATABASE,
                visible: true,
                done: "編集する",
                danger: true,
                content: paramsForm
            });
        };

        const onClickApply = (selected_data: LibraryListDataType) => {
            if (window.opener || !window.opener.closed) {
                window.opener.onCallbackApply(selected_data);
            }
            window.close();
        };

        console.log(data);

        switch (mode) {
            case Constants.library.mode.frame_select:
                if (data && data.type === Constants.library.type.frame) {
                    _onClickApply = (data) => onClickApply(data);
                }
                break;
            case Constants.library.mode.folder_select:
                break;
            case Constants.library.mode.list:
                _onClickDelete = () => onClickDelete();
                _onClickMove = () => onClickMove();
                _onClickEditEncoding = (data) => onClickEditEncoding(data);
                if (data && data.type === Constants.library.type.database) {
                    _onClickEdit = (data) => onClickEditDatabase(data);
                } else if (data && data.type === Constants.library.type.trash) {
                    _onClickCleanTrash = onClickCleanTrash;
                } else if (data && data.type === Constants.library.type.database) {
                    _onClickEdit = (data) => onClickEditDatabase(data);
                }
                break;
        }


        const getEndPoint = (libraryType: string): string | null => {
            let endPoint: string | null = null;
            switch (libraryType) {
                case Constants.library.type.frame:
                    endPoint = "frames/";
                    break;
                case Constants.library.type.document:
                    break;
                case Constants.library.type.folder:
                    endPoint = "folders/";
                    break;
                case Constants.library.type.database:
                    endPoint = "databases/";
                    break;
                case Constants.library.type.remoteFolder:
                    break;
                default:
                    break;
            }

            return endPoint;
        };

        const updateLibrary = (libraryChildren: any[], uuid: string, library): LibraryChild[] => {
            return libraryChildren.map((child: any) => {
                if (uuid === child.uuid) {
                    return library;
                }
                return child;
            });
        };

        const onBlurTitle = (
            e: React.FocusEvent<HTMLInputElement>, selected_data: any) => {
            // Label の修正
            if (!selected_data) {
                return;
            }

            const uuid = selected_data.uuid;
            const libraryType = selected_data.type;

            let endPoint = getEndPoint(libraryType);

            if (!endPoint) {
                return;
            }

            let body: any = {
                label: e.target.value
            };
            if (selected_data.type === Constants.library.type.database) {
                body = {
                    label: e.target.value,
                    dbms: selected_data.dbms,
                    hostname: selected_data.hostname,
                    port: selected_data.port,
                    database: selected_data.database,
                    user_id: selected_data.user_id,
                    password: selected_data.password
                };
            }

            APIUtil.put(endPoint + uuid, body).then((response) => {
                if (response.data.success) {

                    const resultLabel = response.data.data.label;

                    if (!(libraryChildren)) {
                        return;
                    }

                    let updateLibraryChild = findLibrary(libraryChildren, uuid);

                    if (!updateLibrary) {
                        return;
                    }
                    updateLibraryChild.label = resultLabel;
                    const newLibraryChildren = updateLibrary(libraryChildren, uuid, updateLibraryChild);

                    if (selected_data) {
                        selected_data = updateLibrary;
                    }


                    setLibraryChildren(newLibraryChildren);
                    setSelectedDatas(selected_data);
                    // forceUpdate
                }
            });
        };

        const onClickDelete = () => {
            ModalUtil.registerModal({
                id: Constants.modal.CONFIRM, onClickDone: () => {
                    let queue = Queue(
                        1, // concurrency
                        {
                            "retry": 0               //Number of retries
                            , "retryIsJump": false     //retry now?
                            , "timeout": 0            //The timeout period
                        }
                    );
                    let lock = {uuid: null};
                    setIsLoading(true);
                    selectedDatas.forEach((selectedData: LibraryChild) => {
                        queue.push(deleteLibrary, [selectedData, lock]);
                    });
                    queue.push(setIsLoading, [false]);
                    queue.push(fetchFolder, []);
                    queue.start();
                    ModalUtil.closeModal(Constants.modal.CONFIRM);
                    setLastSelected(null);
                }
            });
            let targets: string[] = [];
            selectedDatas.forEach((data) => {
                targets.push(data.label);
            });

            ModalUtil.emitModal({
                id: Constants.modal.CONFIRM,
                visible: true,
                done: "削除する",
                danger: true,
                content: <div>
                    {targets.join(",")} を削除しますか？
                </div>
            });
        };

        const onClickEditEncoding = (data) => {


            const onChangeEncoding = (e, data) => {
                data.encoding = e.target.value;

                ModalUtil.emitModal({
                    id: Constants.modal.EDIT_ENCODING,
                    visible: true,
                    done: "反映する",
                    danger: true,
                    content: renderEditEncodingForm(data)
                });
            };

            const onChangeNewline = (e, data) => {
                data.newline = e.target.value;

                ModalUtil.emitModal({
                    id: Constants.modal.EDIT_ENCODING,
                    visible: true,
                    done: "反映する",
                    danger: true,
                    content: renderEditEncodingForm(data)
                });
            };

            const renderEditEncodingForm = (data) => {
                let encodings: any = [];
                Constants.encodings.forEach((value) => {
                    let encoding = <React.Fragment key={value}>
                        <option value={value}>{value}</option>
                    </React.Fragment>;
                    encodings.push(encoding);
                });

                let newlines: any = [];
                Constants.newlines.forEach((value) => {
                    let newline = <React.Fragment key={value}>
                        <option value={value}>{value}</option>
                    </React.Fragment>;
                    newlines.push(newline);
                });

                return <React.Fragment>
                    <div>
                        <label>文字コード</label>
                    </div>
                    <select value={data.encoding} onChange={(e) => onChangeEncoding(e, data)}>
                        {encodings}
                    </select>
                    <div>
                        <label>改行コード</label>
                    </div>
                    <div>
                        <select value={data.newline} onChange={(e) => onChangeNewline(e, data)}>
                            {newlines}
                        </select>
                    </div>
                </React.Fragment>;
            };

            ModalUtil.registerModal({
                id: Constants.modal.EDIT_ENCODING, onClickDone: () => {
                    if (data.type === Constants.library.type.frame) {

                        setIsLoading(true);
                        APIUtil.put("frames/" + data.uuid, {
                            encoding: data.encoding,
                            newline: data.newline
                        })
                            .then(() => {
                                setIsLoading(false);
                            });
                    }
                    ModalUtil.closeModal(Constants.modal.EDIT_ENCODING);
                }
            });

            ModalUtil.emitModal({
                id: Constants.modal.EDIT_ENCODING,
                visible: true,
                done: "反映する",
                danger: true,
                content: renderEditEncodingForm(data)
            });
        };


        console.log(selectedDatas);

        return <LibraryInspector
            selected={selectedDatas}
            lastSelected={lastSelected}
            onClickDelete={_onClickDelete}
            onClickApply={_onClickApply}
            onClickMove={_onClickMove}
            onClickEdit={_onClickEdit}
            onClickEditEncoding={_onClickEditEncoding}
            onClickCleanTrash={_onClickCleanTrash}
            onBlurTitle={(e) => onBlurTitle(e, data)}
            visualizers={visualizers}
        />;
    };

    const findLibrary = (libraryChildren: any[], uuid: string): LibraryChild => {
        return libraryChildren.find((child: any) => {
            return (child.uuid === uuid);
        });
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
