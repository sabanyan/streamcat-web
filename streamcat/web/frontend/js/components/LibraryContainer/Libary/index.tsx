import React from 'react';
import { useEffect, useRef, useState } from "react";
import {useAsyncResource, resourceCache, AsyncResourceContent} from 'use-async-resource';
import Queue from "promise-queue-plus";
import * as lodash from "lodash";
import { reject } from "lodash";
import { EmptyState, Loader, Spacer } from "Shared/Base";
import { Flex } from "Shared/Base/Layouts/Flex";
import { NotificationManager, useStreamCatNotifications } from "Shared/Notification";
import { ModalManager } from "Shared/Modal";
import { FileUploader, TextField } from "Shared/Input";
import {LibraryMultiInspector} from 'Shared/Inspector/LibraryMultiInspector';
import {ParamsForm} from "Shared/Inspector/ParamsForm";
import { LibraryInspector, MemberForm } from "Shared/Inspector/index";
import TrashInspector from "Shared/Inspector/TrashInspector";
import { FileListTable } from "Components/LibraryContainer/Libary/FileListTable";
import { BreadCrumb, IBreadCrumbsLink } from "Components/LibraryContainer/Libary/BreadCrumb";
import { TrashMenuList } from "Components/LibraryContainer/Libary/TrashMenuList";
import { ApplyMenuList } from "Components/LibraryContainer/Libary/ApplyMenuList";
import { MenuList } from "Components/LibraryContainer/Libary/MenuList";
import { useRemoteFolderHooks, Mode as RemoteFolderMode } from "Components/LibraryContainer/Libary/RemoteFolder/model"
import { RemoteFolderForm } from "Components/LibraryContainer/Libary/RemoteFolder/view"
import { ITableHeader } from "Components/LibraryContainer/Libary/FileListTable/FileListHeader";
import { MessageModel, VisualizeModel, VisualizeModelProps } from "Model/index";
import { DatumType, ParentProjectType, ParentFolderType, ParentTrashType , RemoteFolderType, DatabaseType, FrameType, Member, FlowType, FolderType, TrashType, ProjectType, ActivityType, ScheduleType } from "Model/Library";
import { UserType } from 'Model/Navigation/NavigationModel';
import { APIUtil, APIUtil2, ErrorUtil, HttpUtil, ModalUtil, ReactDomUtil, StringUtil, WebUtil } from "Utils/index";
import LibraryUtil from "Utils/LibraryUtil";
import Constants from "Constants/index";
import { RemoteFolderDrawer } from '../RemoteFolderDrawer';
import { MultiDataDrawer } from '../MultiDataDrawer';
import { FlowDrawer } from '../FlowDrawer';
import { DatabaseDrawer } from '../DatabaseDrawer';
import { FolderDrawer } from '../FolderDrawer';
import { SystemFolderDrawer } from '../SystemFolderDrawer';
import { TrashFolderDrawer } from '../TrashFolderDrawer';
import { TrashDrawer } from '../TrashDrawer'
import { ProjectDrawer } from '../ProjectDrawer';
import { FrameDrawer } from '../FrameDrawer';
import { UnkownDrawer } from '../UnkownDrawer';
import { ActivityDrawer } from '../ActivityDrawer';
import { ScheduleDrawer } from '../ScheduleDrawer';

/**
 * ライブラリ画面に表示するDatumの表示行
 */
export type DatumEntryType = DatumType & {
    selected: boolean;
    clickable: boolean;
}

export interface Database {
    label?: string;
    dbms?: any;
    hostname?: string;
    port?: number;
    database?: string;
    userId?: string;
    password?: string;
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
            "name": "userId",
            "type": "string",
            "label": "ユーザID",
            "default": ""
        },
        {
            "name": "password",
            "isPassword": true,
            "type": "string",
            "label": "パスワード",
            "default": ""
        }
    ];
};

// useAsyncResourceに渡す関数はコンポーネントの外で定義しないと
// useAsyncResourceのキャッシュが機能しない
const getParentFolder = () => {
    if(inject_folder_uuid){
        if(inject_is_project){
            // プロジェクトを表示する場合
            return APIUtil2.findProject(inject_folder_uuid);
        }else{
            // フォルダを表示する場合
            return APIUtil2.findFolder(inject_folder_uuid);
        }
    }else if(inject_is_trash) {
        // ゴミ箱を表示する場合
        return APIUtil2.findTrash();
    }else{
        // ルートフォルダを表示する場合
        return APIUtil2.findLibrary();
    }
}

const getProjects = (members:boolean) => {
    if(inject_folder_uuid || inject_is_trash){
        // ルートフォルダ以外の場合は何もしない
        return APIUtil2.findEmpty();
    }else{
        // ルートフォルダを表示する場合
        return APIUtil2.findProjects(true, false, members);
    }
}

const Library = () => {

     // ここでフォルダの取得を開始する
    const [folderReader] = useAsyncResource(getParentFolder, []);

    // ルートフォルダを表示する場合は
    // ここで全てのプロジェクトのメンバリストを取得する
    // (GET /projects?members=1はSQLが遅いので画面表示用とは別に非同期に取得する)
    const [projectsReader, refreshProjects] = useAsyncResource(getProjects, true);

    const {notifySuccess, notifyWarning, notifyError} = useStreamCatNotifications();
    const [parentFolder, setParentFolder] = useState<ParentFolderType>(folderReader());
    const [sortedDatas, setSortedDatas] = useState<DatumType[]>(folderReader().children);
    const [selectedDatas, setSelectedDatas] = useState<DatumType[]>([]);
    const [lastSelectedCell, setLastSelectedCell] = useState<DatumType | null>(null);
    const [formProjectName, setFormProjectName] = useState<string>("");
    const [formFolderName, setFormFolderName] = useState<string>("");
    const [formFlowName, setFormFlowName] = useState<string>("");
    const [addDatabase, setAddDatabase] = useState<Database | null>(null);
    const [editDatabase, setEditDatabase] = useState<Database | null>(null);
    const [visualizers, setVisualizers] = useState<VisualizeModel<VisualizeModelProps>[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDialog] = useState<boolean>((HttpUtil.getURLParam("dialog") === "true"));
    const [mode] = useState(HttpUtil.getURLParam("mode") ? HttpUtil.getURLParam("mode") : Constants.library.mode.list);
    const [links, setLinks] = useState<IBreadCrumbsLink[]>([]);
    const clickedLibraryCell = useRef(false);

    // custom hooks
    const { onAddRemoteFolder,
            onEditRemoteFolder,
            onChangeRemoteFolder,
            clearRemoteFolder,
            remoteFolder,
            remoteFolderMode,
            setRemoteFolder,
            setRemoteFolderMode } = useRemoteFolderHooks();

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.ADD_DOCUMENT, onClickClose: onClickAddDocumentDone
        });
        ModalUtil.registerModal({
            id: Constants.modal.IMPORT_FLOW, onClickClose: onClickImportFlowDone
        });
        getVisualizers();
    }, []);

    useEffect(() => {
        if (isDialog) {
            const bodyEl = document.querySelector("body");
            if (bodyEl) bodyEl.classList.add("dialog");
        }
    }, [isDialog]);

    useEffect(() => {
        if (!parentFolder) return;
        setLinks(makeBreadCrumbLinks(parentFolder.folderPath));
    }, [parentFolder]);

    useEffect(() => {
        // プロジェクトの作成
        ModalUtil.registerModal({
            id: Constants.modal.ADD_PROJECT, onClickDone: () => {
                if (formProjectName.length === 0) {
                    alert("プロジェクト名を入力して下さい");
                    return;
                }
                setIsLoading(true);
                parentFolder.createProject(formProjectName).then(project => {
                    // useAsyncResourceが保持するプロジェクトのキャッシュを削除する
                    resourceCache(getProjects).clear();
                    // ルートフォルダ直下の全てのプロジェクトを再取得する
                    refreshProjects(true);
                    // ダイアログを閉じる
                    ModalUtil.closeModal(Constants.modal.ADD_PROJECT);
                    fetchFolder();
                    setFormProjectName("");
                    notifySuccess('プロジェクトを作成しました', project.label);
                });
            }
        });
    }, [formProjectName]);

    useEffect(() => {
        // フォルダの作成
        ModalUtil.registerModal({
            id: Constants.modal.ADD_FOLDER, onClickDone: () => {
                if (formFolderName.length === 0) {
                    alert("ファルダ名を入力してください");
                    return;
                }
                setIsLoading(true);
                parentFolder.createFolder(formFolderName).then(folder => {
                    notifySuccess('フォルダを作成しました', folder.label);
                    setFormFolderName("");
                    ModalUtil.closeModal(Constants.modal.ADD_FOLDER);
                    fetchFolder();
                }).catch(error => {
                    notifyError('フォルダ作成エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)));
                }).finally(() => {
                    setIsLoading(false);
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
                // POST /flowsを発行してフローを新規作成する
                parentFolder.createFlow(formFlowName).then((flow) => {
                    ModalUtil.closeModal(Constants.modal.ADD_FLOW);
                    setFormFlowName("");
                    fetchFolder();
                    notifySuccess('フローを作成しました', flow.label);
                });
                return true;
            }
        });
    }, [formFlowName]);

    useEffect(() => {
        if (remoteFolderMode === RemoteFolderMode.INIT) return;
        if (remoteFolderMode === RemoteFolderMode.ADD) {
            // add_remote_folder
            ModalUtil.registerModal({
                id: Constants.modal.ADD_REMOTE_FOLDER, onClickDone: () => {
                    if (remoteFolder.label === "") {
                        alert("名称を入力してください");
                        return;
                    }
                    if (remoteFolder.protocol === "") {
                        alert("プロトコルを入力してください");
                        return;
                    }
                    if (remoteFolder.hostname === "") {
                        alert("ホスト名を入力してください");
                        return;
                    }
                    if (remoteFolder.domain === "") {
                        alert("ドメインを入力してください");
                        return;
                    }
                    if (remoteFolder.directory === "") {
                        alert("ディレクトリーを入力してください");
                        return;
                    }
                    onAddRemoteFolder(parentFolder.uuid, remoteFolder)
                        .then((response) => {
                            fetchFolder();
                            if (!response.data.success) {
                                notifyError('リモートフォルダ作成エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)));
                            } else {
                                notifySuccess('リモートフォルダを保存しました', remoteFolder.label);
                            }
                        })
                    setIsLoading(false);
                    setRemoteFolderMode(RemoteFolderMode.INIT);
                    ModalUtil.closeModal(Constants.modal.ADD_REMOTE_FOLDER);
                }
            });
            ModalUtil.emitModal({
                id: Constants.modal.ADD_REMOTE_FOLDER,
                visible: true,
                done: "追加する",
                dynamic: true,
                content: <RemoteFolderForm remoteFolder={remoteFolder} onChange={(e, param, value) => onChangeRemoteFolder(param.name, value)} />
            });
        } else if (remoteFolderMode === RemoteFolderMode.EDIT) {
            // edit_remote_folder
            ModalUtil.registerModal({
                id: Constants.modal.EDIT_REMOTE_FOLDER, onClickDone: () => {
                    if (remoteFolder.label === "") {
                        alert("名称を入力してください");
                        return;
                    }
                    if (remoteFolder.protocol === "") {
                        alert("プロトコルを入力してください");
                        return;
                    }
                    if (remoteFolder.hostname === "") {
                        alert("ホスト名を入力してください");
                        return;
                    }
                    if (remoteFolder.domain === "") {
                        alert("ドメインを入力してください");
                        return;
                    }
                    if (remoteFolder.directory === "") {
                        alert("ディレクトリーを入力してください");
                        return;
                    }
                    onEditRemoteFolder(remoteFolder.uuid, remoteFolder)
                        .then((response) => {
                            fetchFolder();
                            if (!response.data.success) {
                                notifyError('リモートフォルダ設定エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)));
                            } else {
                                notifySuccess('リモートフォルダを保存しました', remoteFolder.label);
                            }
                        })
                    setIsLoading(false);
                    setRemoteFolderMode(RemoteFolderMode.INIT);
                    ModalUtil.closeModal(Constants.modal.EDIT_REMOTE_FOLDER);
                }
            });
            ModalUtil.emitModal({
                id: Constants.modal.EDIT_REMOTE_FOLDER,
                visible: true,
                done: "設定する",
                dynamic: true,
                content: <RemoteFolderForm remoteFolder={remoteFolder} onChange={(e, param, value) => onChangeRemoteFolder(param.name, value)} />
            });
        }
    }, [remoteFolder]);

    useEffect(() => {
        /**
         * ハンドリングできないエラー表示
         */
        const unhandledNotify = (title: string) => {
            setIsLoading(false);
            notifyError(title, Constants.errorMessage.unhandledError);
        };

        // データベースの編集
        const database = editDatabase;
        if (!database) return;
        const params = getDataBaseParams();
        const completeEditDatabase = (response: any) => {
            if (!response.data.success) {
                notifyError('データベース作成エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)));
            } else {
                notifySuccess('データベースを保存しました', database.label || '');
            }
            setIsLoading(false);
            setEditDatabase(null);
            ModalUtil.closeModal(Constants.modal.EDIT_DATABASE);
            fetchFolder();
            // hotfix 編集後Paneが持っているseletedDatasの情報が更新されない
            setSelectedDatas([]);
        };

        const editLibraryChild = (data: DatumType) => {
            setIsLoading(true);
            APIUtil.put("databases/" + data.uuid, database).then((response) => {
                completeEditDatabase(response);
            }, () => {
                unhandledNotify("データベース修正エラー");
            }).then(() => {
                setIsLoading(false);
            });
        };

        const onChangeEditDatabase = (e, param, value) => {
            try {
                const newDatabase = database;
                if (newDatabase) {
                    newDatabase[param.name] = value;
                    setEditDatabase(newDatabase);
                    const params = getDataBaseParams();
                    const paramsForm = <ParamsForm params={params} args={newDatabase} invalids={{}} parentUUID={parentFolder.uuid}
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

        const paramsForm = <ParamsForm params={params} args={database} invalids={{}} parentUUID={parentFolder.uuid}
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
        const paramsForm = <ParamsForm params={params} args={database} invalids={{}} parentUUID={parentFolder.uuid}
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

    // window.visualizersに保存していたはずのvisualizersがなくなる場合があるため、再取得
    const getVisualizers = () => {
        APIUtil2.findVCommands().then(visualizers => {
            const visualizerModels = visualizers.map(visualizer => new VisualizeModel(visualizer));
            setVisualizers(visualizerModels);
        });
    };

    const makeBreadCrumbLinks = (folderPath: any[] | any): IBreadCrumbsLink[] => {
        const dialogOption = (isDialog) ? "?dialog=true" + ((mode) ? "&mode=" + mode : "") : "";
        return folderPath.map((path, index): IBreadCrumbsLink => {
            const isCurrent = ((folderPath.length - 1) === index);

            // HTML headのtitleにカレントフォルダ名を設定する
            if (isCurrent){
                document.title = path.label;
            }

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

    const onClickAddDocumentDone = () => {
        fetchFolder();
    };

    const onClickImportFlowDone = () => {
        fetchFolder();
    };

    const onClickAddDatabaseDone = () => {
        const database = addDatabase;
        if (!database) return;

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

        setIsLoading(true);
        parentFolder.createDatabase(
            database.label,
            database.dbms,
            database.hostname,
            database.port,
            database.database,
            database.userId,
            database.password
        ).then(database => {
            notifySuccess('データベースを作成しました', database.label);
        }).catch(error => {
            notifyError('データベース作成エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)));
        }).finally(() => {
            setIsLoading(false);
            setAddDatabase(null);
            ModalUtil.closeModal(Constants.modal.ADD_DATABASE);
            fetchFolder();
        });
    };

    const fetchFolder = () => {
        return getParentFolder().then(response => {
            // 取得したフォルダ等を状態変数に格納する
            setParentFolder(response);
            setSortedDatas(response.children);
            // フォルダの取得が完了したらisLoading=falseにする
            setIsLoading(false);
            return response;
        }).catch(e => {
            notifyError('フォルダ取得エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(e)));
        });
    };

    const clearSelected = () => {
        parentFolder!.children.map((selectedData) => {
            (selectedData as DatumEntryType).selected = false;
        });
        setSelectedDatas([]);
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

    const onClickImportFlow = () => {
        let url = location.protocol + "//" + location.host + "/api/v0/archives/flows";
        ModalUtil.emitModal({
            id: Constants.modal.IMPORT_FLOW,
            visible: true,
            done: "アップロードする",
            content: <div>
                <FileUploader uploadType='flow' accept={[".tgz"]} parent={parentFolder} notify={notifySuccess} />
            </div>
        });
    };

    const onClickCSVUpload = () => {
        let url = location.protocol + "//" + location.host + "/api/v0/documents";
        ModalUtil.emitModal({
            id: Constants.modal.ADD_DOCUMENT,
            visible: true,
            done: "アップロードする",
            content: <div>
                <FileUploader uploadType='document' accept={["text/csv,application/pdf,image/*"]} parent={parentFolder} notify={notifySuccess} />
            </div>
        });
    };

    const onClickSelectDestination = () => {
        if (window.opener || !window.opener.closed) {
            window.opener.onCallbackApply(parentFolder.uuid);
        }
        window.close();
    };

    const getApiPath = (uuid:string):string => {
        if(inject_folder_uuid || inject_is_trash){
            // ルートフォルダ以外の場合
            return {
                project:`projects/${uuid}`,
                folder: `folders/${uuid}`,
                trash:  `trashes`
            }[parentFolder.type];
        }else{
            // ルートフォルダの場合
            return `library`;
        }
    };

    const onClickAddDatabase = () => {
        const nullDatabase = {
            label: "",
            dbms: getDataBaseParams()[1].default,
            hostname: "",
            port: NaN,
            database: "",
            userId: "",
            password: ""
        };
        setAddDatabase(nullDatabase);
    };

    const onClickEditRemoteFolder = (data:any) => {
        setRemoteFolder(data);
        setRemoteFolderMode(RemoteFolderMode.EDIT);
        ModalUtil.emitModal({
            id: Constants.modal.EDIT_REMOTE_FOLDER,
            visible: true,
            done: "設定する",
            dynamic: true,
            content: <RemoteFolderForm remoteFolder={remoteFolder} onChange={(e, param, value) => onChangeRemoteFolder(param.name, value)} />
        });
    }

    const onChangeNewDatabase = (e: React.ChangeEvent<HTMLInputElement>, param, value) => {
        try {
            if (addDatabase) {
                setAddDatabase({ ...addDatabase, ...{ [param.name]: value } });
            }
        } catch (e) {
            console.log(e);
        }
    };

    const onClickCleanTrash = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                APIUtil.delete("trashes").then((response) => {
                    if (response.data.success !== true) throw response.data;
                    notifySuccess('ゴミ箱を空にしました');
                    fetchFolder();
                }).catch(e => {
                    notifyError('ゴミ箱エラー', e.message);
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

    const onClickEditDatabase = (data: DatabaseType) => {
        if (data.type !== Constants.library.type.database) {
            return;
        }

        const database: Database = {
            "label": data.label,
            "dbms": data.dbms,
            "hostname": data.hostname,
            "port": data.port,
            "database": data.database,
            "userId": data.userId,
            "password": data.password
        };
        setEditDatabase(database);
    };

    const onClickApply = (selected_data: DatumType) => {
        if (window.opener || !window.opener.closed) {
            window.opener.onCallbackApply(selected_data);
        }
        window.close();
    };

    const renderLibraryInspector = (): React.ReactNode => {
        // 項目が選択されていなければインスペクタを表示しない
        if(!selectedDatas.length){
            return null;
        }

        let _onClickApply: any = null;
        let _onClickEdit: any = null;
        let _onClickCleanTrash: any = null;
        let _onClickDelete: any = null;
        let _onClickMove: any = null;
        let _onClickEditEncoding: any = null;
        let _onBlurTitle: ((e:any, selectedData:DatumType) => void) | null = null;
        let _onClickMemberInfo: any = null;
        let _onChangeEditLock: any = null;

        const moveLibrary = (datum:DatumType, parentFolderUUID:string) => {
            let promise: Promise<DatumType>;
            if (datum.type === Constants.library.type.flow) {
                // Flowの場合は、Lockを取得してから移動する
                promise = APIUtil2.createLock(datum.uuid).then(async lock => {
                    // Datumを移動する(移動の完了を待つ)
                    await datum.move(parentFolderUUID, lock.uuid);
                    return lock;
                }).then(lock => {
                    // Datumのの移動が完了した後に、Lockを解除する
                    lock.delete();
                    return datum;
                });
            }else{
                // Datumを移動する
                promise = datum.move(parentFolderUUID); 
            }

            // 移動完了メッセージを表示する
            return promise.then(datum => {
                // 成功
                const typeLabel = LibraryUtil.getTypeLabel(datum.type);
                notifySuccess(typeLabel + 'を移動しました', datum.label);
            })
            .catch((e) => {
                // 例外
                notifyError(`ライブラリー移動エラー(${datum.label})`, e.message);
            });
        };

        const deleteLibrary = (datum: DatumType) => {
            let promise: Promise<void>;
            if (datum.type === Constants.library.type.flow) {
                // Flowの場合は、Lockを取得してから削除する
                promise = APIUtil2.createLock(datum.uuid).then(async lock => {
                    // Datumを削除する(削除の完了を待つ)
                    await datum.delete(lock.uuid);
                    return lock;
                }).then(lock => {
                    // Datumのの削除が完了した後に、Lockを解除する
                    lock.delete();
                });
            }else{
                // Datumを削除する
                promise = datum.delete(); 
            }

            // 削除完了メッセージを表示する
            return promise.then(() => {
                // 成功
                const typeLabel = LibraryUtil.getTypeLabel(datum.type);
                notifySuccess(typeLabel + 'を削除しました', datum.label);
            })
            .catch((e) => {
                // エラー
                notifyError(`ライブラリー削除エラー(${datum.label})`, e.message);
            });
        };

        const onClickMove = () => {
            let queue = Queue(
                1, // concurrency
                {
                    "retry": 0               //Number of retries
                    , "retryIsJump": false   //retry now?
                    , "timeout": 0           //The timeout period
                }
            );
            let lock = { uuid: null };
            // 移動先フォルダ選択ダイアログは、現在の位置のフォルダを初期表示する
            HttpUtil.windowOpen(
                getApiPath(parentFolder.uuid) + '?dialog=true&mode=folder_select',
                (folder_uuid) => {
                    setIsLoading(true);
                    selectedDatas.forEach((selectedData: DatumType) => {
                        queue.push(moveLibrary, [selectedData, folder_uuid, lock]);
                    });
                    queue.push(setIsLoading, [false]);
                    queue.push(fetchFolder, []);
                    queue.start();
                }
            );
        };

        const _onClickCopy = (e, data: DatumType) => {
            if (data.type == "flow") {
                ModalUtil.registerModal({
                    id: Constants.modal.CONFIRM, onClickDone: () => {
                        APIUtil.post("flows", { source: data.uuid }).then((response) => {
                            if (response.data.success) {
                                fetchFolder();
                                notifySuccess('フローを複製しました', response.data.data.label);
                            } else {
                                reject(response)
                            }

                        }).catch((response) => {
                            notifyError('複製エラー', response.data.message);
                        });
                        ModalUtil.closeModal(Constants.modal.CONFIRM);
                    }
                });

                ModalUtil.emitModal({
                    id: Constants.modal.CONFIRM,
                    visible: true,
                    done: "複製する",
                    danger: false,
                    content: <div>
                        {selectedDatas[0].label} を複製しますか？
                    </div>
                });
            }
        }

        const onClickDelete = () => {
            ModalUtil.registerModal({
                id: Constants.modal.CONFIRM,
                onClickDone: () => {
                    let queue = Queue(
                        1, // concurrency
                        {
                            "retry": 0              //Number of retries
                            , "retryIsJump": false  //retry now?
                            , "timeout": 0          //The timeout period
                        }
                    );
                    setIsLoading(true);
                    selectedDatas.forEach((selectedData: DatumType) => {
                        queue.push(deleteLibrary, [selectedData]);
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

        /**
         * ラベル名を変更する
         * @param e 
         * @param selectedData
         */
         const onBlurTitle = (e:React.FocusEvent<HTMLInputElement>, selectedData:DatumType) => {
            // Label の修正
            if (!selectedData) {
                return;
            }

            const newLabel = e.target.value;
            if(!newLabel || newLabel === selectedData.label) {
                return;
            }

            let promise: Promise<any>;

            setIsLoading(true);
            if(selectedData.type === 'flow'){
                // フローのラベル名を変更するには排他ロックを獲得する必要がある
                promise = APIUtil2.createLock(selectedData.uuid).then(lock => {
                    selectedData.rename(newLabel, lock.uuid).then(datum => {
                    // ライブラリ画面を再表示する
                        fetchFolder();
                    }).finally(() => {
                        lock.delete();
                    });
                });
            }else{
                promise = selectedData.rename(newLabel).then(datum => {
                // ライブラリ画面を再表示する
                    fetchFolder();
                });
            }

            promise.catch(error => {
                notifyError('エラー', error.message);
            }).finally(() => {
                setIsLoading(true);
            });
        };

        const onClickEditEncoding = (data: DatumType) => {

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
                        const frame = data as FrameType;
                        setIsLoading(true);
                        APIUtil.put("frames/" + data.uuid, {
                            encoding: frame.encoding,
                            newline: frame.newline
                        })
                            .then(() => {
                                setIsLoading(false);
                                const typeLabel = LibraryUtil.getTypeLabel(frame.type);
                                notifySuccess(typeLabel + 'の文字コードを変更しました', frame.label);
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

        // 選択されているのが 2件以上の場合はMultiDataDrawerを使う
        if(selectedDatas.length >= 2){
            // モードに応じた処理
            if(mode === Constants.library.mode.list) {
                return <MultiDataDrawer parent={parentFolder} data={selectedDatas} onSuccess={fetchFolder}/>;
            }else{
                return <></>;
            }
        }

        // 選択されているのが 1件 の場合の処理
        const selectedData = selectedDatas[0];

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
                _onBlurTitle = (e, data) => onBlurTitle(e, data);
                if (selectedData && selectedData.type === Constants.library.type.database) {
                    _onClickEdit = (data) => onClickEditDatabase(data);
                } else if (selectedData && selectedData.type === Constants.library.type.remoteFolder) {
                    _onClickEdit = (data) => onClickEditRemoteFolder(data);
                } else if (selectedData && selectedData.type === Constants.library.type.trash) {
                    _onBlurTitle = null;
                    _onClickCleanTrash = onClickCleanTrash;
                } else if (selectedData && selectedData.type === Constants.library.type.project) {
                    _onClickMemberInfo = (project) => {
                        emitMemberModal(project.members || [], []);
                    }
                }
                break;
        }

        /**
         * フローの編集ロックを変更する
         */
        _onChangeEditLock = (e, flow:FlowType) => {
            // 編集ロックの値を取得する
            const editLocked = e.currentTarget.checked;

            return APIUtil2.createLock(flow.uuid).then(async lock => {
                // 編集ロックの値を変更する
                await flow.updateLock(editLocked, lock.uuid).then(flow => {
                    // ロックの値を変更後に、カレントフォルダを再読み込みする
                    fetchFolder();
                    // インスペクターを更新する
                    setSelectedDatas([flow]);
                }).catch(error => {
                    // 編集ロックの値の変更に失敗した場合
                    notifyError('エラー', error.message);
                });
                return lock;
            }).then(lock => {
                // 排他ロックを解除する
                lock.delete();
            }).catch(error => {
                // 排他ロックに失敗した場合
                notifyError('エラー', error.message);
            });
        };

        /**
         * プロジェクトメンバのダイアログを表示する
         * @param members
         * @param searchedUsers
         */
        const emitMemberModal = (members:Member[], searchedUsers:UserType[], doneEnabled:boolean=false) => {
            /**
             * プロジェクトのメンバを更新する
             */
            const initMembers = (members:Member[]) => {
                // ルートフォルダ直下の全てのプロジェクトを取得する
                const projects = projectsReader()
                if(!projects){
                    return;
                }
                // 選択中のプロジェクトを取得する
                const project = projects.find(child => child.uuid===selectedData.uuid) as ParentProjectType;
                if(!project){
                    return;
                }
                // メンバ情報の型変換
                const currentMemberList = members.map(member => 
                    {
                        return {
                            uuid: member.uuid,
                            type: member.type
                        };
                    }
                );
                // 指定されたメンバでプロジェクトを更新する
                project.initMembers(currentMemberList, project.modifiedAt).then(project => {
                    // useAsyncResourceが保持するプロジェクトのキャッシュを削除する
                    resourceCache(getProjects).clear();
                    // ルートフォルダ直下の全てのプロジェクトを再取得する
                    refreshProjects(true);
                    // 更新を通知する
                    notifySuccess('メンバー情報保存', 'プロジェクトのメンバー情報を保存しました');
                }).catch(error => {    
                    notifyError('メンバー情報保存エラー', error.message);
                    throw error;
                });
            };

            /**
             * 検索語を含むユーザを検索し、結果を一覧表示する
             */
            const onSearchTextInputed = (e, members:Member[]) => {
                // 検索語を取得する
                const searchText = e.currentTarget.value;
                // 検索語を含むユーザを取得する
                if (searchText) {
                    APIUtil2.findUsers(searchText, true).then(users => {
                        // 既にプロジェクトメンバに登録されているユーザを取得結果から除外する
                        const searchedUsers = users.filter(user => {
                            return members!.findIndex(member => member.uuid===user.uuid) === -1;
                        });
                        // プロジェクトメンバのダイアログを、検索したユーザリストで更新する
                        emitMemberModal(members, searchedUsers);
                    });
                }else{
                    // 検索語が空の場合は、検索結果を空にする
                    emitMemberModal(members, []); 
                }
            }

            /**
             * プロジェクトメンバに指定したユーザを追加する
             */
            const onSearchedMemberClicked = (e, members:Member[], newUser:UserType) => {
                const newMember = {...newUser, type: 'Reader'} as Member;
                const newMembers = [...members, newMember];
                // プロジェクトメンバのダイアログを、新しいメンバで更新する
                emitMemberModal(newMembers, [], true);
            }

            /**
             * プロジェクトメンバの権限を変更する、または削除する
             */
            const onMemberRoleChanged = (e, members:Member[], editMember:Member) => {
                // 選択されたメンバの権限を更新する
                const selectedType = e.currentTarget.value;

                let newMembers: Member[];
                if(selectedType==='Del'){
                    // '削除する'が選択されメンバを一覧から削除する
                    newMembers = members.filter(member => {
                        return member.uuid !== editMember.uuid;
                    });
                } else {
                    // 選択されたメンバの権限を変更する
                    newMembers = members.map(member => {
                        if (member.uuid === editMember.uuid) {
                            const newMember = {...member};
                            newMember.type = selectedType;
                            return newMember;
                        }else{
                            return member;
                        }
                    })
                }

                // プロジェクトメンバのダイアログを、新しいメンバの権限で更新する
                emitMemberModal(newMembers, [], true);
            }

            // ダイアログを登録する
            ModalUtil.registerModal({
                id: Constants.modal.MEMBER_INFO,
                onClickClose : () => {},
                onClickCancel: () => {},
                onClickDone: () => {
                    doneEnabled && initMembers(members);
                    ModalUtil.closeModal(Constants.modal.MEMBER_INFO);
                }
            });

            // ダイアログ内に表示するFormを指定して、ダイアログを表示する
            ModalUtil.emitModal({
                id: Constants.modal.MEMBER_INFO,
                visible: true,
                done: "保存する",
                content: <MemberForm members={members}
                                     searchedUsers={searchedUsers}
                                     onSearchTextInputed={onSearchTextInputed}
                                     onSearchedMemberClicked={onSearchedMemberClicked}
                                     onMemberRoleChanged={onMemberRoleChanged} />
            });
        };

        return <AsyncResourceContent
                // フォルダ情報を取得中の場合
                fallback={<LibraryInspector projectsReader={() => null}
                                            selectedData={selectedData} />}>
            {
                selectedData.type !== 'rfolder' ?
                <LibraryInspector projectsReader={projectsReader}
                                    selectedData={selectedData}
                                    onClickCopy={_onClickCopy}
                                    onClickDelete={_onClickDelete}
                                    onClickApply={_onClickApply}
                                    onClickMove={_onClickMove}
                                    onClickEdit={_onClickEdit}
                                    onClickEditEncoding={_onClickEditEncoding}
                                    onChangEditLock={_onChangeEditLock}
                                    onClickCleanTrash={_onClickCleanTrash}
                                    onClickMemberInfo={_onClickMemberInfo}
                                    onBlurTitle={_onBlurTitle} />:
                <></>
            }
        </AsyncResourceContent>
    };

    const renderTrashInspector = (): React.ReactNode => {
        if (!selectedDatas.length) return null;

        const datum = selectedDatas[0];

        const doRecovery = () => {
            if(parentFolder.type !== 'trash'){
                throw new Error('Trash folder is not selected.');
            }
            const trashFolder = parentFolder as ParentTrashType;
            trashFolder.putBack(datum.uuid).catch((e) => {
                let message = new MessageModel(e);
                if(message.messageStatus==='warning'){
                    notifyWarning(message.title || '', message.message);
                }else{
                    notifyError(message.title || '', message.message);
                }
            }).then(() => {
                fetchFolder();
            });
        };

        const onClickRecovery = (e, data) => {
            ModalUtil.registerModal({
                id: Constants.modal.CONFIRM, onClickDone: () => {
                    doRecovery();
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

        const onClickMove = (e, libraryData: DatumType) => {
            HttpUtil.windowOpen(
                getApiPath(parentFolder.uuid) + '?dialog=true&mode=folder_select',
                (newParentUuid) => {
                    // Datumを移動する
                    let promise: Promise<any>;
                    if(libraryData.type === 'flow'){
                        promise = APIUtil2.createLock(libraryData.uuid).then(lock => {
                            libraryData.move(newParentUuid, lock.uuid).then(flow => {
                                lock.delete().then(() => {
                                    // ライブラリ画面を再読み込みする
                                    fetchFolder();
                                });
                            });
                        });
                    }else{
                        promise = libraryData.move(newParentUuid).then(datum => {
                            // ライブラリ画面を再読み込みする
                            fetchFolder();
                        });
                    }
                    // エラー処理
                    promise.catch((e) => {
                        notifyError('エラー', e.message);
                    });
                }
            );
        };

        return <TrashInspector data={datum}
            onClickRecovery={(e, data) => onClickRecovery(e, data)}
            onClickMove={(e, data) => onClickMove(e, data)}
        />;
    };

    const renderEmptyState = () => {
        return <EmptyState
            icon={"inbox"}
            title={"ライブラリが空です"}
            description={"表示できるファイルがありません"}>
        </EmptyState>;
    };

    const renderAll = () => {
        const isEmptyLibraryList = !Array.isArray(parentFolder!.children) || parentFolder!.children.length === 0;

        if (isEmptyLibraryList && mode === Constants.library.mode.dialog){
            return renderEmptyState();
        }

        const onClickFileName = (body: DatumType, event?: React.SyntheticEvent<any, Event>) => {
            if (event) event.stopPropagation();
            const dialogOption = (isDialog) ? "?dialog=true" + ((mode) ? "&mode=" + mode : "") : "";

            if (body.type === "trash") {
                WebUtil.navigateURL(WebUtil.webURL("/trashes" + dialogOption));
            }else if (body.type === "folder") {
                WebUtil.navigateURL(WebUtil.webURL("/folders/" + body.uuid + dialogOption));
            }else if (body.type === "project") {
                WebUtil.navigateURL(WebUtil.webURL("/projects/" + body.uuid + dialogOption));
            }else if (body.type === "database") {
                onClickEditDatabase(body as DatabaseType);
            }else if (body.type === "frame") {
                if (mode === Constants.library.mode.frame_select) {
                    // データソースの追加時
                    onClickApply(body);
                    return;
                }
                window.open(WebUtil.webURL("/preview?step_id=null&dialog=false&frame_uuid=" + body.uuid + "&title=" + StringUtil.urlEncode(body.label)));
            }else if (body.type === "document") {
                window.open(WebUtil.webURL("/documents/" + body.uuid));
            }else if (body.type === "flow") {
                if(mode===Constants.library.mode.flow_select){
                    // フロー選択モードの場合
                    onClickApply(body);
                    return;
                }
                window.open(WebUtil.webURL("/flows/" + body.uuid + dialogOption));
            }else if (body.type==='activity') {
                window.open(WebUtil.webURL("/flows/" + (body as ActivityType).flowUuid + dialogOption));
            }
        };

        const onClickCell = (cell: DatumEntryType, event?: React.MouseEvent<HTMLTableRowElement>): void => {
            let data = cell;
            // ライブラリ画面の単体表示時のみ複数選択を許可
            let enableMultiSelect = (!inject_is_trash && mode === Constants.library.mode.list) ? true : false;
            if (isLoading) return;
            if (event) event.stopPropagation();

            if (event && (event.metaKey || event.ctrlKey) && enableMultiSelect) {
                data.selected = true;
                // command or ctrl + click
                if (selectedDatas.includes(data)) {
                    data.selected = !data.selected;
                    setSelectedDatas(selectedDatas.filter(d => d.uuid !== data.uuid));
                    if (!data.selected) {
                        setLastSelectedCell(null);
                    }
                } else {
                    selectedDatas.push(data);
                    setLastSelectedCell(data);
                }
            } else if (event && event.shiftKey && enableMultiSelect) {
                // shift + click
                clearSelected();// 選択状態を一旦解除
                const children = parentFolder!.children;
                let current = children.findIndex(libraryChild => data.uuid === libraryChild.uuid);
                if (lastSelectedCell) {
                    let last = children.findIndex(libraryChild => lastSelectedCell.uuid === libraryChild.uuid);
                    let min, max;
                    if (current >= last) {
                        min = last;
                        max = current;
                    } else {
                        min = current;
                        max = last;
                    }
                    const selectedEntries = children.slice(min, max + 1).map((selectedData) => {
                        (selectedData as DatumEntryType).selected = true;
                        return selectedData;
                    });
                    setSelectedDatas(selectedEntries);
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
            } else if (mode===Constants.library.mode.frame_select || mode===Constants.library.mode.flow_select) {
                return null;
            } else {
                if (!inject_is_trash) {
                    menuList = <MenuList
                        parent={parentFolder}
                        allowlist={parentFolder!.allowlist}
                        fetchFolder={fetchFolder}
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
                                setSortedDatas(lodash.orderBy(parentFolder!.children, header.key, header.sort));
                            } else {
                                setSortedDatas(parentFolder!.children);
                            }
                        }}
                        bodies={
                            sortedDatas.map((datum) => {
                                const body = datum as DatumEntryType;
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
                                        case Constants.library.type.remoteFolder:
                                        case Constants.library.type.database:
                                            body.clickable = true;
                                    }
                                }else if(mode===Constants.library.mode.flow_select){
                                    switch(body.type){
                                        case 'flow':
                                        case 'folder':
                                        case 'project':
                                            body.clickable = true;
                                    };
                                } else {
                                    body.clickable = true;
                                    if (body.type === "database") body.clickable = false;
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

    const isSystemFolder = (datum:DatumType) => {
        const cacheFolderUuid = 'cc9f050d-b007-414e-a6e0-6d31a9c13395';
        const activityFolderUuid = 'aa2799ba-798e-4fa3-984c-b3fad92fd162';
        return datum.uuid===cacheFolderUuid || datum.uuid===activityFolderUuid;
    };

    const refreshLibrary = (datum:DatumType) => {
        // フォルダを再取得する
        fetchFolder();
        // 状態変数を更新する
        setSelectedDatas([datum]);
    };

    const refreshLibraryAndProjects = (datum) => {
        // useAsyncResourceが保持するプロジェクトのキャッシュを削除する
        resourceCache(getProjects).clear();
        // ルートフォルダ直下の全てのプロジェクトを再取得する
        refreshProjects(true);
        refreshLibrary(datum)
    };

    const getProject = (project:DatumType|null) => {
        if(!project){
            return null;
        }
        const projectUuid = project.uuid;
        // ルートフォルダ直下の全てのプロジェクトから、指定されたプロジェクトを取得する
        const ret = projectsReader().find(child => child.uuid===projectUuid) as ParentProjectType;
        if(!ret){
            return null;
        }
        return ret;
    };

    const getProjectDrawer = (datum:ProjectType|null) => {
        const project = getProject(datum);
        if(project){
            return <ProjectDrawer
                        createMode={false} 
                        parent={parentFolder}
                        project={project}
                        onSuccess={refreshLibraryAndProjects} />;
        }else{
            // プロジェクトが見つからない場合はペインを表示しない
            return <></>;
        }
    };

    const getTrashDrawer = (datum:DatumType|null) => {
        if(datum){
            return <TrashDrawer 
                        trashFolder={parentFolder as ParentTrashType}
                        datum={datum}
                        onSuccess={data=>refreshLibrary(data[0])} />;
        }else{
            // Datumをゴミ箱から戻した直後にselectedDatas[0]がundefinedになるため、
            return <></>;
        }
    };

    // Datum型とペイン種別の対応テーブル
    const drawersTable = {
        project:    getProjectDrawer(selectedDatas[0] as ProjectType),
        folder:     <FolderDrawer
                        createMode={false} 
                        parent={parentFolder}
                        folder={selectedDatas[0] as FolderType}
                        onSuccess={refreshLibrary} />,
        rfolder:    <RemoteFolderDrawer
                        createMode={false}
                        parent={parentFolder}
                        remoteFolder={selectedDatas[0] as RemoteFolderType}
                        onSuccess={refreshLibrary} />,
        database:   <DatabaseDrawer
                        createMode={false}
                        parent={parentFolder}
                        datum={selectedDatas[0] as DatabaseType}
                        onSuccess={refreshLibrary} />,
        flow:       <FlowDrawer
                        createMode={false} 
                        parent={parentFolder}
                        flow={selectedDatas[0] as FlowType}
                        onSuccess={refreshLibrary} />,
        frame:      <FrameDrawer
                        createMode={false}
                        parent={parentFolder}
                        frame={selectedDatas[0] as FrameType}
                        onSuccess={refreshLibrary} />,
        schedule:   <ScheduleDrawer
                        createMode={false}
                        parent={parentFolder}
                        schedule={selectedDatas[0] as ScheduleType}
                        onSuccess={refreshLibrary} />,
        activity:   <ActivityDrawer activity={selectedDatas[0] as ActivityType} />,
        trash:      <TrashFolderDrawer
                        trashFolder={selectedDatas[0] as TrashType} />,

    };

    const systemFolderDrawer = <SystemFolderDrawer folder={selectedDatas[0] as FolderType} />;
    const unkownDrawer = <UnkownDrawer
                            parent={parentFolder}
                            datum={selectedDatas[0]}
                            onSuccess={data => refreshLibrary(data[0])} />;

    return <>
        <Loader center={true} absolute={true} visible={isLoading} />
        {renderAll()}
        {
            selectedDatas.length===1 ? (
                isSystemFolder(selectedDatas[0])? systemFolderDrawer:
                parentFolder.type==='trash'? getTrashDrawer(selectedDatas[0]):
                drawersTable[selectedDatas[0].type] || unkownDrawer
            ): <></>
        }
        <ModalManager />
        <NotificationManager />
    </>;

};

export { Library };
