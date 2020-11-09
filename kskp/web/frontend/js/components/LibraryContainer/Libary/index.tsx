import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { ModalManager } from "Shared/Modal";
import { NotificationManager } from "Shared/Notification";
import { FileUploader, TextField } from "Shared/Input";
import { FileListTable } from "Components/LibraryContainer/Libary/FileListTable";
import { BreadCrumb, IBreadCrumbsLink } from "Components/LibraryContainer/Libary/BreadCrumb";
import Constants from "Constants/index";
import { APIUtil, ErrorUtil, HttpUtil, ModalUtil, ReactDomUtil, StringUtil, WebUtil } from "Utils/index";
import { EmptyState, Loader, Spacer } from "Shared/Base";
import { ITableBody } from "Components/LibraryContainer/Libary/FileListTable/FileListBody";
import { MenuList } from "Components/LibraryContainer/Libary/MenuList";
import { Flex } from "Shared/Base/Layouts/Flex";
import { useDispatch } from "react-redux";
import { addNotification, removeNotification } from "reapop";
import ParamsForm from "Shared/Inspector/ParamsForm";
import { ITableHeader } from "Components/LibraryContainer/Libary/FileListTable/FileListHeader";
import { LibraryChild } from "Model/Library";
import { LibraryInspector, MemberForm } from "Shared/Inspector/index";
import { LibraryModel, LocksModel, MessageModel, VisualizeModel, VisualizeModelProps } from "Model/index";
import { LibraryListDataType } from "Types/index";
import * as lodash from "lodash";
import Queue from "promise-queue-plus";
import { API } from "Modules/api";
import { TrashMenuList } from "Components/LibraryContainer/Libary/TrashMenuList";
import axios from "axios";
import TrashInspector from "Shared/Inspector/TrashInspector";
import { ApplyMenuList } from "Components/LibraryContainer/Libary/ApplyMenuList";
import LibraryUtil from "Utils/LibraryUtil";
import { Props as NavigationModelProps } from 'Model/Navigation/NavigationModel';
import { project } from '../../shared/IconRenderer/icon/index';
import LibraryMultiInspector from 'Shared/Inspector/LibraryMultiInspector';

export interface Database {
    label?: string;
    dbms?: any;
    hostname?: string;
    port?: string;
    database?: string;
    user_id?: string;
    password?: string;
}

export interface Allowlist {
    copy: boolean;
    createFile: boolean;
    createFolder: boolean;
    createProject: boolean;
    delete: boolean;
    download: boolean;
    execute: boolean;
    findMember: boolean;
    lock: boolean;
    move: boolean;
    read: boolean;
    update: boolean;
    updateMember: boolean;
    upload: boolean;
}

export const getDataBaseRules = () => {
    // TODO rulesの型定義
    return {
        "label": {
            "presence": { "allowEmpty": false }
        },
        "dbms": {
            "presence": { "allowEmpty": false }
        },
        "hostname": {
            "presence": { "allowEmpty": false }
        },
        "port": {
            "presence": { "allowEmpty": false }
        }
    };
};
export const getDataBaseParams = () => {
    // TODO paramsの型定義
    return [
        {
            "name": "label",
            "type": "string",
            "label": "名称"
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
            "name": "hostname",
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
            "name": "password",
            "type": "string",
            "label": "パスワード",
            "default": ""
        }
    ];
};

const getInitialDatabase = (): Database => {
    return {
        label: "",
        dbms: getDataBaseParams()[1].default,
        hostname: "",
        port: "",
        database: "",
        user_id: "",
        password: ""
    };
};

export interface Member {
    createdAt: string;
    creator: string;
    email: string;
    name: string;
    state: string;
    type: string;
    uuid: string;
}

export interface ProjectInfo {
    members?: Member[];
    projectModifiedAt?: string;
}

const defaultAllowlist = {
    copy: false,
    createFile: false,
    createFolder: false,
    createProject: false,
    delete: false,
    download: false,
    execute: false,
    findMember: false,
    lock: false,
    move: false,
    read: false,
    update: false,
    updateMember: false,
    upload: false
}

interface Props {
    navigation?: NavigationModelProps
}

const Library = (_: Props) => {

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
    const [addDatabase, setAddDatabase] = useState<Database | null>(null);
    const [editDatabase, setEditDatabase] = useState<Database | null>(null);
    const [, setStores] = useState();
    const [libraryChildren, setLibraryChildren] = useState<LibraryListDataType[]>([]);
    const [initialLibraryChildren, setInitialLibraryChildren] = useState<LibraryListDataType[]>([]);
    const [selectedDatas, setSelectedDatas] = useState<LibraryChild[]>([]);
    const [lastSelectedCell, setLastSelectedCell] = useState<LibraryChild | null>(null);
    const [visualizers, setVisualizers] = useState<VisualizeModel<VisualizeModelProps>[]>([]);
    const clickedLibraryCell = useRef(false);
    const [folderPath, setFolderPath] = useState<any>();
    const [isLoading, setIsLoading] = useState<Boolean>();
    const [is_finished, setIsFinished] = useState<Boolean>();
    const [isDialog] = useState<Boolean>((HttpUtil.getURLParam("dialog") === "true"));
    const [mode] = useState(HttpUtil.getURLParam("mode") ? HttpUtil.getURLParam("mode") : Constants.library.mode.list);
    const isProject = inject_is_project;
    const [links, setLinks] = useState<IBreadCrumbsLink[]>([]);
    const [allowlists, setAllowlists] = useState
        <{parent: Allowlist, selected: Allowlist}>
        ({parent: defaultAllowlist, selected: defaultAllowlist})
    const [currentProject, setCurrentProject] = useState<ProjectInfo>({})
    const [remountCount, setRemountCount] = useState(0);
    const refresh = () => setRemountCount(remountCount + 1);

    useEffect(() => {
        if (isDialog) {
            const bodyEl = document.querySelector("body");
            if (bodyEl) bodyEl.classList.add("dialog");
        }
    }, [isDialog]);

    useEffect(() => {
        if (!folderPath) return;
        setLinks(makeBreadCrumbLinks(folderPath));
    }, [folderPath]);

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.ADD_FRAME, onClickClose: onClickAddFrameDone
        });
        getVisualizers();
        fetchFolder();
    }, []);

    useEffect(() => {
        // プロジェクトの作成
        ModalUtil.registerModal({
            id: Constants.modal.ADD_PROJECT, onClickDone: () => {
                if (formProjectName.length === 0) {
                    alert("プロジェクト名を入力して下さい");
                    return;
                }
                setIsLoading(true);
                APIUtil.post("projects", { label: formProjectName, parent: inject_folder_uuid }).then(() => {
                    ModalUtil.emitModal(
                        { id: Constants.modal.ADD_PROJECT, visible: false });
                    fetchFolder();
                    setFormProjectName("");
                    notify({
                        title: "プロジェクトを作成しました", message: formProjectName + "を作成しました",
                        status: "success"
                    });
                });
            }
        });
    }, [formProjectName]);


    useEffect(()=>{
        if(selectedDatas.length === 1){
            const selectedData = selectedDatas[0];
            if (selectedData && selectedData.type === "project") {
                APIUtil.get("projects/" + selectedData.uuid + "?members=on&allowlist=on").then((response) => {
                    if (response.data.success && response.data.data.members) {
                        setCurrentProject({
                            members: response.data.data.members,
                            projectModifiedAt: response.data.data.modifiedAt
                        })
                        setAllowlists({...allowlists, selected:response.data.data.allowlist});
                    }
                })
            }
        }
    },[selectedDatas])

    useEffect(() => {
        // フォルダの作成
        ModalUtil.registerModal({
            id: Constants.modal.ADD_FOLDER, onClickDone: () => {
                if (formFolderName.length === 0) {
                    alert("ファルダ名を入力してください");
                    return;
                }
                setIsLoading(true);
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
        // フローの作成
        ModalUtil.registerModal({
            id: Constants.modal.ADD_FLOW, onClickDone: () => {
                if (!formFlowName) {
                    alert("フロー名を入力してください");
                    return false;
                }
                setIsLoading(true);
                APIUtil.post("flows", {
                    name: formFlowName,
                    project_uuid: inject_folder_uuid, // TODO project_uuid のキーが将来的に変更になる可能性あり、実態はfolderのuuidが利用できる
                    datasource: {
                        "type": "frame"
                    }
                }).then(() => {
                    ModalUtil.closeModal(Constants.modal.ADD_FLOW);
                    setFormFlowName("");
                    fetchFolder();
                    notify({
                        title: "フローを作成しました", message: formFlowName + "を作成しました",
                        status: "success"
                    });
                });
                return true;
            }
        });
    }, [formFlowName]);

    useEffect(() => {
        // データベースの編集
        const database = editDatabase;
        if (!database) return;
        const params = getDataBaseParams();
        const completeEditDatabase = (response: any) => {
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
                    title: "データベースを保存しました", message: (database) ? database.label : "" + "を保存しました",
                    status: "success"
                });
            }
            setIsLoading(false);
            setEditDatabase(null);
            ModalUtil.closeModal(Constants.modal.EDIT_DATABASE);
            fetchFolder();

        };

        const editLibraryChild = (data: LibraryListDataType) => {
            setIsLoading(true);
            APIUtil.put("databases/" + data.uuid, database).then((response) => {
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
                    setEditDatabase(newDatabase);
                    const params = getDataBaseParams();
                    const paramsForm = <ParamsForm params={params} args={newDatabase} invalids={{}}
                        onChange={(e, param, value) => onChangeEditDatabase(e, param, value)} />;
                    ModalUtil.emitModal({
                        id: Constants.modal.EDIT_DATABASE,
                        visible: true,
                        done: "設定する",
                        danger: true,
                        content: paramsForm
                    });
                }
            } catch (e) {
                console.log(e);
            }
        };

        const paramsForm = <ParamsForm params={params} args={database} invalids={{}}
            onChange={(e, param, value) => onChangeEditDatabase(e, param, value)} />;
        ModalUtil.registerModal({
            id: Constants.modal.EDIT_DATABASE, onClickDone: () => {
                editLibraryChild(selectedDatas[0]);
                setEditDatabase(null);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.EDIT_DATABASE,
            visible: true,
            done: "設定する",
            danger: true,
            content: paramsForm
        });

    }, [editDatabase]);


    useEffect(() => {
        // データベースの新規作成
        const database = addDatabase;
        if (!database) return;
        const params = getDataBaseParams();
        const paramsForm = <ParamsForm params={params} args={database} invalids={{}}
            onChange={(e, param, value) => onChangeNewDatabase(e, param, value)} />;
        ModalUtil.registerModal({
            id: Constants.modal.ADD_DATABASE, onClickDone: onClickAddDatabaseDone
        });
        ModalUtil.emitModal({
            id: Constants.modal.ADD_DATABASE,
            visible: true,
            done: "追加する",
            dynamic: true,
            content: paramsForm
        });
    }, [addDatabase]);

    const getVisualizers = () => {
        // window.visualizersに保存していたはずのvisualizersがなくなる場合があるため、再取得
        APIUtil.get("visualizers").then((response) => {
            const json = response.data;
            const visualizers = json.data.map((visualize) => {
                return new VisualizeModel(visualize);
            });
            setVisualizers(visualizers);
        });
    };
    const makeBreadCrumbLinks = (folderPath: any[] | any): IBreadCrumbsLink[] => {
        const dialogOption = (isDialog) ? "?dialog=true" + ((mode) ? "&mode=" + mode : "") : "";
        return folderPath.map((path, index): IBreadCrumbsLink => {
            const isCurrent = ((folderPath.length - 1) === index);
            if (index === 0) {
                // ルートはライブラリを指定
                return {
                    uuid: path.uuid,
                    label: "ライブラリ",
                    url: "/library" + dialogOption,
                    current: isCurrent,
                    type: "folder"
                };
            }

            let url_prefix;
            if (path.type === "folder") {
                url_prefix = "/folders/";
            } else if (path.type === "project") {
                url_prefix = "/projects/";
            }

            return {
                uuid: path.uuid,
                label: path.label,
                url: url_prefix + path.uuid + dialogOption,
                current: isCurrent,
                type: path.type
            };
        });
    };

    const onClickAddFrameDone = () => {
        fetchFolder();
    };

    const onClickAddDatabaseDone = () => {
        const database = addDatabase;
        if (!database) return;
        try {
            if (!database.label) {
                alert("名称を入力してください");
                return;
            }
            if (!database.dbms) {
                alert("DBMSを入力してください");
                return;
            }
            if (!database.hostname) {
                alert("ホスト名を入力してください");
                return;
            }
            if (!database.port) {
                alert("ポート番号を入力してください");
                return;
            }

            const body = {
                label: database.label,
                parent: inject_folder_uuid,
                dbms: database.dbms,
                hostname: database.hostname,
                port: Number(database.port),
                database: database.database,
                user_id: database.user_id,
                password: database.password
            };
            setIsLoading(true);
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
        const database = addDatabase;
        if (!database) return;
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
        setAddDatabase(null);
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

    const clearSelected = () => {
        setSelectedDatas([]);
        setLibraryChildren(libraryChildren.map((libraryChildren: LibraryListDataType) => {
            libraryChildren.selected = false;
            return libraryChildren;
        }));
    };

    const getFolderChildren = () => {
        if (inject_folder_uuid) {
            if (isProject) {
                return APIUtil.get("projects/" + inject_folder_uuid).then((response) => {
                    const json = response.data.data;
                    const { children, folderPath } = json;
                    setInitialLibraryChildren(children);
                    setLibraryChildren(children);
                    setFolderPath(folderPath);
                    setAllowlists({...allowlists, parent:json.allowlist});
                });
            }
            //該当フォルダを取得
            return APIUtil.get("folders/" + inject_folder_uuid).then((response) => {
                if (response.data.success) {
                    const json = response.data.data;
                    const { children, folderPath } = json;
                    setInitialLibraryChildren(children);
                    setLibraryChildren(children);
                    setFolderPath(folderPath);
                    setAllowlists({...allowlists, parent:json.allowlist});
                } else {
                    APIUtil.get("awss3s/" + inject_folder_uuid).then((response) => {
                        if (response.data.success) {
                            const json = response.data.data;
                            const { children, folderPath } = json;
                            setInitialLibraryChildren(children);
                            setLibraryChildren(children);
                            setFolderPath(folderPath);
                            setAllowlists({...allowlists, parent:json.allowlist});
                        }
                    });
                }
            });
        } else if (inject_is_trash) {
            // ゴミ箱の場合
            return new Promise(async (resolve) => {
                await API.request.doGet.trashes({})
                    .then((response) => {
                        if (response.data.data) {
                            let model = new LibraryModel(response.data.data);
                            setInitialLibraryChildren(model.children);
                            setLibraryChildren(model.children);
                            setFolderPath(model.folderPath);
                            setAllowlists({...allowlists, parent:response.data.data.allowlist});
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
            });
        } else {
            //ルートを取得
            return APIUtil.get("library").then((response) => {
                const json = response.data.data;
                if (response.data.success) {
                    const { children, folderPath } = json;
                    setInitialLibraryChildren(children);
                    setLibraryChildren(children);
                    setFolderPath(folderPath);
                    setAllowlists({...allowlists, parent:json.allowlist});
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
                    onChange={(e) => setFormFlowName(e.target.value)} />
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
            done: "作成する",
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
            done: "アップロードする",
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

    const onClickAddDatabase = () => {
        setAddDatabase(getInitialDatabase());
    };

    const onChangeNewDatabase = (e: React.ChangeEvent<HTMLInputElement>, param, value) => {
        try {
            if (addDatabase) {
                setAddDatabase({ ...addDatabase, ...{ [param.name]: value } });
            }
        } catch (e) {
            console.log(e);
        }
    };

    const isEmptyLibraryList = () => {
        if (!is_finished) {
            return false;
        }
        return !Array.isArray(libraryChildren) || libraryChildren.length === 0;
    };

    const renderAll = () => {
        if (!is_finished) return null;
        if (isEmptyLibraryList() && mode === Constants.library.mode.dialog) return renderEmptyState();

        const onClickFileName = (body: ITableBody, event?: React.SyntheticEvent<any, Event> ) => {
            if (event) event.stopPropagation();
            const dialogOption = (isDialog) ? "?dialog=true" + ((mode) ? "&mode=" + mode : "") : "";

            if (body.type === "trash") {
                WebUtil.navigateURL(WebUtil.webURL("/trashes" + dialogOption));
            }
            if (body.type === "folder") {
                WebUtil.navigateURL(WebUtil.webURL("/folders/" + body.uuid + dialogOption));
            }
            if (body.type === "project") {
                WebUtil.navigateURL(WebUtil.webURL("/projects/" + body.uuid + dialogOption));
            }
            if (body.type === "database") {
                onClickEditDatabase(body);
            }
            if (body.type === "frame") {
                if (mode === Constants.library.mode.frame_select) {
                    // データソースの追加時
                    onClickApply(body);
                    return;
                }
                window.open(WebUtil.webURL("/preview?step_id=null&dialog=false&frame_uuid=" + body.uuid + "&title=" + StringUtil.urlEncode(body.label)));
            }
            if (body.type === "flow") {
                window.open(WebUtil.webURL("/flows/" + body.uuid + dialogOption));
            }

        };

        const onClickCell = (cell: ITableBody, event?: React.MouseEvent<HTMLTableRowElement>): void => {
            let data: LibraryListDataType = cell;
            if (isLoading)return;
            if (event) event.stopPropagation();
            if (data.allowlist) {
                setAllowlists({...allowlists, selected:data.allowlist})
            }

            if (event && (event.metaKey || event.ctrlKey)) {
                data.selected = true;
                // command or ctrl + click
                if (selectedDatas.includes(data)) {
                    data.selected = !data.selected;
                    setSelectedDatas(selectedDatas.filter(d => d.uuid !== data.uuid));
                    if(!data.selected){
                        setLastSelectedCell(null);
                    }
                } else {
                    selectedDatas.push(data);
                    setLastSelectedCell(data);
                }
            } else if (event && event.shiftKey) {
                // shift + click
                clearSelected();// 選択状態を一旦解除
                let current = libraryChildren.findIndex(libraryChild => data.uuid === libraryChild.uuid);
                if (lastSelectedCell) {
                    let last = libraryChildren.findIndex(libraryChild => lastSelectedCell.uuid === libraryChild.uuid);
                    let min, max;
                    if (current >= last) {
                        min = last;
                        max = current;
                    } else {
                        min = current;
                        max = last;
                    }
                    const selectedDatas: LibraryListDataType[] = libraryChildren.slice(min, max + 1).map((libraryChild) => {
                        libraryChild.selected = true;
                        return libraryChild;
                    });
                    setSelectedDatas(selectedDatas);
                }
            } else {
                // 単一選択
                clearSelected();
                data.selected = true;
                setSelectedDatas([data]);
                setLastSelectedCell(data);
            }
            clickedLibraryCell.current = true;
        };

        const onMouseDownLibrary = () => {
            if (clickedLibraryCell.current) {
                clearSelected();// 選択状態を一旦解除
                setLastSelectedCell(null);
                clickedLibraryCell.current = false;
            }
        };

        const onClickDeleteAll = () => {
            onClickCleanTrash();
        };

        const renderMenuList = () => {
            let menuList;
            if (mode === Constants.library.mode.folder_select) {
                menuList = <ApplyMenuList

                    onClickApply={onClickSelectDestination}
                />;
            } else if (mode === Constants.library.mode.frame_select) {
                return null;
            } else {
                if (!inject_is_trash) {
                    menuList = <MenuList
                        allowlist={allowlists.parent}
                        onClickAddDatabase={onClickAddDatabase}
                        onClickCSVUpload={onClickCSVUpload}
                        onClickNewFlow={onClickNewFlow}
                        onClickNewFolder={onClickNewFolder}
                        onClickNewProject={onClickNewProject}
                    />;
                } else {
                    menuList = <TrashMenuList
                        onClickDeleteAll={onClickDeleteAll}
                    />;
                }
            }

            return <>
                <Spacer minWidth={40} />
                <Flex flexDirection={"column"} fluid={true} width={280}>
                    <Spacer height={160} />
                    {menuList}
                </Flex>
            </>;
        };


        return <Flex justifyContent={"center"} fluid={true}>
            {
                (!inject_is_trash) ?
                    renderLibraryInspector()
                    :
                    renderTrashInspector()

            }
            <Flex flexDirection={"row"} width={1480 + 40 + 40} minHeight={"calc(100vh - 64px)"} fluid={true}
                onMouseDown={onMouseDownLibrary}>
                <Spacer width={40} />
                <Flex flexDirection={"column"} fluid={true}>
                    <Spacer height={40} />
                    <BreadCrumb links={links} />
                    <Spacer height={8} />
                    <FileListTable
                        minWidth={800}
                        onClickCell={onClickCell}
                        onClickFileName={onClickFileName}
                        onClickHeader={(header: ITableHeader, event) => {
                            if (event) event.stopPropagation();
                            if (header.sort) {
                                setLibraryChildren(lodash.orderBy(libraryChildren, header.key, header.sort));
                            } else {
                                setLibraryChildren(initialLibraryChildren);
                            }
                        }}
                        bodies={
                            libraryChildren.map((libraryChild) => {
                                const body = libraryChild as ITableBody;
                                if (mode === Constants.library.mode.folder_select) {
                                    switch (body.type) {
                                        case "folder":
                                        case "project":
                                            body.clickable = true;
                                    }
                                } else if (mode === Constants.library.mode.frame_select) {
                                    switch (body.type) {
                                        case "frame":
                                        case "folder":
                                        case "project":
                                            body.clickable = true;
                                    }
                                } else {
                                    body.clickable = true;
                                }
                                if (inject_is_trash) {
                                    // ゴミ箱の場合は全て選択不可
                                    body.clickable = false;
                                }
                                return body;
                            })
                        }
                    />
                    <Spacer height={80} />
                </Flex>
                {renderMenuList()}
                <Spacer width={40} />
            </Flex>
        </Flex>;
    };

    const deleteLibrary = async (library: LibraryChild, lock: { uuid: string | null }) => {

        return new Promise(async (resolve, reject) => {
            // Lockが必要なライブラリー(flow)の場合は、Lockを取得する
            if (library.type === Constants.library.type.flow) {
                await API.request.doPost.locks({ flowUUID: library.uuid })
                    .then((res) => {
                        if (res && !res.data.success) throw res.data;
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
                    if (res && !res.data.success) throw res.data;
                })
                .catch((e) => {
                    console.log(e);
                    reject(e);
                });

            // Lockを取得した場合、Lockを解除する
            if (lock.uuid) {
                await API.request.doDelete.locks({ lockUUID: lock.uuid })
                    .then((res: any) => {
                        lock.uuid = null;
                        if (res && !res.data.success) throw res.data;
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
                const typeLabel = LibraryUtil.getTypeLabel(library.type);
                notify({
                    title: typeLabel + "を削除しました",
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
                await API.request.doPost.locks({ flowUUID: library.uuid })
                    .then((res) => {
                        if (res && !res.data.success) throw res.data;
                        lock.uuid = API.response.post.locks(res).uuid;
                    })
                    .catch((e) => {
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
                    if (res && !res.data.success) throw res.data;
                })
                .catch((e) => {
                    console.log(e);
                    reject(e);
                });

            // Lockを取得した場合、Lockを解除する
            if (lock.uuid) {
                await API.request.doDelete.locks({ lockUUID: lock.uuid })
                    .then((res: any) => {
                        lock.uuid = null;
                        if (res && !res.data.success) throw res.data;
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
                const typeLabel = LibraryUtil.getTypeLabel(library.type);
                notify({
                    title: typeLabel + "を移動しました", message: library.label + "を移動しました",
                    status: "success"
                });
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
        if (!selectedDatas.length) return null;
        const data: LibraryListDataType = selectedDatas[0];

        const doRecovery = (data) => {
            API.request.doPut.trash({ trashUUID: data.uuid })
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
            let body = { target: flow_uuid };
            let locks = new LocksModel(flow_uuid);

            return axios.post("/api/v0/locks", body).then((response) => {
                let locksModel = locks.Parse(response);
                let lockId = locksModel.getLockId();
                if (lockId) {
                    axios.put("/api/v0/flows/" + flow_uuid, {
                        parent: parent_uuid,
                        lock: lockId
                    }).then(() => {
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
                    case Constants.library.type.project:
                        result = APIUtil.put("projects/" + uuid, data);
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
            allowlist={allowlists.selected}
            onClickRecovery={(e, data) => onClickRecovery(e, data)}
            onClickMove={(e, data) => onClickMove(e, data)}
        />;
    };

    const onClickCleanTrash = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                APIUtil.delete("trashes").then((response) => {
                    if (response.data.success !== true) throw response.data;
                    notify({
                        title: "ゴミ箱を空にしました",
                        message: "ゴミ箱を空にしました",
                        status: "success"
                    });
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
                <strong>ゴミ箱にある項目を完全に消去してもよろしいですか？</strong>
                <br />
                この操作は取り消せません。
            </div>
        });
    };

    const onClickEditDatabase = (data: LibraryListDataType) => {
        if (data.type !== Constants.library.type.database) {
            return;
        }
        const database: Database = {
            "label": data.label,
            "dbms": data.dbms,
            "hostname": data.hostname,
            "port": data.port,
            "database": data.database,
            "user_id": data.user_id,
            "password": data.password
        };
        setEditDatabase(database);
    };

    const onClickApply = (selected_data: LibraryListDataType) => {
        if (window.opener || !window.opener.closed) {
            window.opener.onCallbackApply(selected_data);
        }
        window.close();
    };

    const renderLibraryInspector = (): React.ReactNode => {
        if (!selectedDatas.length) return null;

        let _onClickApply: any = null;
        let _onClickEdit: any = null;
        let _onClickCleanTrash: any = null;
        let _onClickDelete: any = null;
        let _onClickMove: any = null;
        let _onClickEditEncoding: any = null;
        let _onBlurTitle: any = null;
        let _onClickMemberInfo: any = null;
        let _onChangeFlowLock: any = null

        const onClickMove = () => {
            let queue = Queue(
                1, // concurrency
                {
                    "retry": 0               //Number of retries
                    , "retryIsJump": false     //retry now?
                    , "timeout": 0            //The timeout period
                }
            );
            let lock = { uuid: null };
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
                    let lock = { uuid: null };
                    setIsLoading(true);
                    selectedDatas.forEach((selectedData: LibraryChild) => {
                        queue.push(deleteLibrary, [selectedData, lock]);
                    });
                    queue.push(setIsLoading, [false]);
                    queue.push(fetchFolder, []);
                    queue.start();
                    ModalUtil.closeModal(Constants.modal.CONFIRM);
                    setLastSelectedCell(null);
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


        // 選択されているのが 2件以上の場合は LibraryMultiInspector を使う
        if(selectedDatas.length >= 2){
            // モードに応じた処理
            switch (mode) {
                case Constants.library.mode.frame_select:
                    break;
                case Constants.library.mode.folder_select:
                    break;
                case Constants.library.mode.list:
                    _onClickDelete = () => onClickDelete();
                    _onClickMove = () => onClickMove();
            }
            return <LibraryMultiInspector
                allowlist={allowlists.selected}
                selectedDatas={selectedDatas}
                onClickDelete={_onClickDelete}
                onClickMove={_onClickMove}
            />;
        }

        // 選択されているのが 1件 の場合の処理
        const selectedData: LibraryListDataType = selectedDatas[0];

        console.assert(selectedData.uuid !== "d8d2fec5-066c-48ec-9ee4-314559aa7ae4", "起きた")
        if(selectedData.uuid === "d8d2fec5-066c-48ec-9ee4-314559aa7ae4"){
            console.trace("起きたよ");
        }

        // モードに応じた処理
        switch (mode) {
            case Constants.library.mode.frame_select:
                // if (data && data.type === Constants.library.type.frame) {
                //     _onClickApply = (data) => onClickApply(data);
                // }
                break;
            case Constants.library.mode.folder_select:
                break;
            case Constants.library.mode.list:
                _onClickDelete = () => onClickDelete();
                _onClickMove = () => onClickMove();
                _onClickEditEncoding = (data) => onClickEditEncoding(data);
                _onBlurTitle = (e,data) => onBlurTitle(e, data);
                if (selectedData && selectedData.type === Constants.library.type.database) {
                    _onClickEdit = (data) => onClickEditDatabase(data);
                } else if (selectedData && selectedData.type === Constants.library.type.trash) {
                    _onBlurTitle = null;
                    _onClickCleanTrash = onClickCleanTrash;
                } else if (selectedData && selectedData.type === Constants.library.type.database) {
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
                case Constants.library.type.project:
                    endPoint = "projects/";
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

            setIsLoading(true);

            APIUtil.put(endPoint + uuid, body).then((response) => {
                if (response.data.success) {
                    fetchFolder();
                }
            }).finally(()=>{
                setIsLoading(false);
            });
        };


        const onClickEditEncoding = (data: LibraryChild) => {


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

                                const typeLabel = LibraryUtil.getTypeLabel(data.type);
                                notify({
                                    title: typeLabel + "の文字コードを変更しました",
                                    message: data.label + "の文字コードを変更しました",
                                    status: "success"
                                });
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

        const emitMemberForm = (members, searchRows, onSearchTextInputed, onSearchedMemberClicked, onMemberRoleChanged) => {
            ModalUtil.emitModal({
                id: Constants.modal.MEMBER_INFO,
                visible: true,
                done: "保存する",
                content: <MemberForm
                    rows={members}
                    searchedRows={searchRows}
                    onSearchTextInputed={onSearchTextInputed}
                    onSearchedMemberClicked={onSearchedMemberClicked}
                    onMemberRoleChanged={onMemberRoleChanged}
                />
            });
        }

        const onMemberRoleChanged = (e, user: any) => {
            const value = e.currentTarget.value
            let currentMembers = currentProject.members;

            if (currentMembers) {
                if (value === "Del") {
                    currentMembers = currentMembers.filter((mem) => {
                        return mem.uuid !== user.uuid
                    })
                } else if (value !== "Del") {
                    currentMembers = currentMembers.map((mem) => {
                        if (mem.uuid === user.uuid) {
                            mem.type = value
                        }
                        return mem
                    })
                }

                currentProject.members = currentMembers;
                emitMemberForm(currentMembers, [], onSearchTextInputed, onSearchedMemberClicked, onMemberRoleChanged)
            }
        }

        const onSearchedMemberClicked = (e, addMember: any) => {
            addMember.type = "Reader"
            let currentMembers = currentProject.members;

            if (currentMembers) {
                currentMembers.unshift(addMember)
                emitMemberForm(currentMembers, [], onSearchTextInputed, onSearchedMemberClicked, onMemberRoleChanged)
            }

        }

        const onSearchTextInputed = async (e) => {
            const searchText = e.currentTarget.value ? e.currentTarget.value : "";
            const currentMembers = currentProject.members;
            let seachResult = []

            if (currentMembers) {
                if (searchText !== "") {
                    
                    let response = await APIUtil.get("/users?q=" + searchText + "&roles=off&projects=on&&except_inactive=on")
                    if (response.data.success && response.data.data) {
                        seachResult = response.data.data
                        
                        seachResult = seachResult.filter((user: any) => {   
                            let result = true;
                            if (currentMembers.some((currentMember:any) => {return currentMember.uuid == user.uuid})) {
                                result = false;
                            }
                       
                            return result
                        })
                    }
                }

                emitMemberForm(currentMembers, seachResult, onSearchTextInputed, onSearchedMemberClicked, onMemberRoleChanged)
            }
        }


        _onClickMemberInfo = (e, projectUUID) => {
            ModalUtil.registerModal({
                id: Constants.modal.MEMBER_INFO, onClickDone: () => {
                    let putBody = {
                        "members": currentProject.members,
                        "lastModifiedAt": currentProject.projectModifiedAt
                    }

                    APIUtil.put("projects/" + projectUUID, putBody).then((response) => {
                        if (response.data.success) {
                            notify({
                                title: "メンバー情報保存",
                                message: "プロジェクトのメンバー情報を保存しました。",
                                status: "success"
                            });
                        } else {
                            notify({
                                title: "",
                                message: response.data.message,
                                status: "warning",
                                dismissAfter: 0,
                                closeButton: true
                            });
                        }
                        refresh();
                    })
                    ModalUtil.closeModal(Constants.modal.MEMBER_INFO);
                }, onClickClose: () => {
                    if (selectedData && selectedData.type === "project") {
                        APIUtil.get("projects/" + selectedData.uuid + "?members=on&allowlist=on").then((response) => {
                            if (response.data.success && response.data.data.members) {
                                setCurrentProject({
                                    members: response.data.data.members,
                                    projectModifiedAt: response.data.data.modifiedAt
                                })
                                setAllowlists({...allowlists, selected:response.data.data.allowlist});
                            }
                        })
                    }
                }, onClickCancel: () => {
                    if (selectedData && selectedData.type === "project") {
                        APIUtil.get("projects/" + selectedData.uuid + "?members=on&allowlist=on").then((response) => {
                            if (response.data.success && response.data.data.members) {
                                setCurrentProject({
                                    members: response.data.data.members,
                                    projectModifiedAt: response.data.data.modifiedAt
                                })
                                setAllowlists({...allowlists, selected:response.data.data.allowlist});
                            }
                        })
                    }
                }
            });

            emitMemberForm(currentProject.members, [], onSearchTextInputed, onSearchedMemberClicked, onMemberRoleChanged)
        };

        _onChangeFlowLock = (e) => {
            const checked = e.currentTarget.checked
        }

        return <LibraryInspector
            currentProject={currentProject}
            allowlist={allowlists.selected}
            selectedData={selectedData}
            onClickDelete={_onClickDelete}
            onClickApply={_onClickApply}
            onClickMove={_onClickMove}
            onClickEdit={_onClickEdit}
            onClickEditEncoding={_onClickEditEncoding}
            onClickCleanTrash={_onClickCleanTrash}
            onClickMemberInfo={_onClickMemberInfo}
            onChangeFlowLock={_onChangeFlowLock}
            onBlurTitle={_onBlurTitle}
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

export { Library };
