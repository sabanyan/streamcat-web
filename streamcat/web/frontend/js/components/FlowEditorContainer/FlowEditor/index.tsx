import React, { useCallback, useEffect, useState } from 'react';
import { useAsyncResource } from 'use-async-resource';
import { PaperScroller } from 'FlowEditorContainer/PaperScroller';
import { Edge, Selector, Step } from 'Shared/SVG';
import {ToolBar} from 'FlowEditorContainer/ToolBar/Core';
import Constants from 'Constants/index';
import style from './style.scss';
import { Api } from 'Api';
import { GraphUtil, ZoomUtil, ModalUtil} from 'Utils/index';
import CommandModel from 'Model/Command/CommandModel';
import { Loader } from 'Shared/Base';
import { DragType, RunnablesType, StepModelType } from 'Types/index';
import { Inspector } from 'Shared/Inspector';
import { DataFrameStepModel, MessageModel, SubflowCommandModel, VisualizeModel } from 'Model/index';
import { NotificationManager, useStreamCatFlowNotification, useStreamCatNotifications } from 'Shared/Notification';
import {
    addHistoryAction,
    addSelectStepAction,
    addStepAction,
    deleteSelectStepAction,
    deleteStepsAction,
    loadFlowJSONAction,
    moveStepsAction,
    redoAction,
    selectStepsAction,
    // setEditModeAction,
    // setExecuteModeAction,
    undoAction,
    // updateDataFrameDetailAction,
    updateStepAction,
    // refreshCanvasSizeAction,
    refreshFlowAction,
    updateLastSavedFlowAction,
    State
} from 'Modules/flowEditor';
import { useDispatch, useSelector } from 'react-redux';
import { Paper } from 'FlowEditorContainer/Paper';
import { FlowEditModeValue, FlowExecuteModeValue, NetworkStatusValue } from 'Model/Flow/FlowModel';
import { NotAllowed } from 'Components/NotAllowedContainer';
import { TextField } from 'Shared/Input';
import useInterval from 'use-interval';
import WebUtil from "Utils/WebUtil";
import _ from 'lodash';
import { LockType } from 'Model/Locks';
import { ErrorResponse } from 'Api';
import { Command, Flow, FlowType, FrameType } from 'Model/Library';

const getLock = (targetUUID:string) => {
    return Api.createLock(targetUUID).catch(e => {
        if(e instanceof ErrorResponse){
            // ロックの取得に失敗した場合はエラー情報を返す
            return e as ErrorResponse;
        }else if(e instanceof Promise){
            // Web APIの応答待ちの場合はPromiseオブジェクトを再送出する
            throw e;
        }else{
            throw e;
        }
    });
};

const FlowEditor = () => {

    const dispatch = useDispatch();
    const folderUuid = useSelector((state:State) => state.flow && state.flow.folderUuid);

    const _modifiedAt = useSelector((state:State) => state.flow && state.flow.modifiedAt);
    useEffect(() => {
        if (_modifiedAt) {
            // modifiedAt が reducer 経由での取得になる
            // 取得タイミングに差があるため取得ができ次第 State にセットする
            setModifiedAt(_modifiedAt);
        }
    }, [_modifiedAt])
    const [modifiedAt, setModifiedAt] = useState<string>();
    const flow = useSelector((state:State) => state.flow);
    // const drag = useSelector((state:State) => state.drag);
    const selected_step_ids = useSelector((state:State) => state.selected_step_ids);
    const nodes = useSelector((state:State) => state.nodes);
    const history = useSelector((state:State) => state.history);
    // const mast = useSelector((state:State) => state.mast);
    // const selected_data_source_detail = useSelector((state:State) => state.selected_data_source_detail);
    const graph = useSelector((state:State) => state.graph);
    // const zoom = useSelector((state:State) => state.zoom);
    // const inspector = useSelector((state:State) => state.inspector);
    // const editor = useSelector((state:State) => state.editor);
    // const editMode = useSelector((state:State) => state.editMode);
    // const executeMode = useSelector((state:State) => state.executeMode);
    // const networkStatus = useSelector((state:State) => state.networkStatus);
    const lastSavedFlow = useSelector((state:State) => state.lastSavedFlow);

    // runnable: FlowまたはCommandを表す
    const [runnables, setRunnables] = useState<RunnablesType>({
        commands: [],
        visualizers: [],
        subflows: [],
        datasrcs: [],
        datadsts: [],
    });

    // 選択中のDataFrameNodeのFrame
    const [selectedFrame, setSelectedFrame] = useState<FrameType>();
    // Canvasでの選択範囲
    const [dragRange, setDragRange] = useState<DragType | null>(null);
    // Canvasの拡大率
    const [zoom, setZoom] = useState(100);

    // 実行可否
    const [executeMode, setExecuteMode] = useState<FlowExecuteModeValue>(FlowExecuteModeValue.NotExecutable);
    // 編集可否
    const [editMode, setEditMode] = useState<FlowEditModeValue>(FlowEditModeValue.ReadOnlyUpdateDisabled);
    // ネットワークの接続状態
    const [networkStatus, setNetworkStatus] = useState<NetworkStatusValue>(NetworkStatusValue.UnKnown);
    // ネットワークオフラインを通知するポップアップのId
    // (オンライン復帰時にポップアップを閉じるために一時保存する)
    const [offLineNotificationId, setOffLineNotificationId] = useState<string | null>(null);
    // const [initialEditMode, setInitialEditMode] = useState<FlowEditModeValue | null>(null);

    // Inspectorの横幅
    const [inspectorWidth, setInspectorWidth] = useState(Constants.default.inspector.width);
    // Canvasの横幅
    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - Constants.default.inspector.width);

    const loadFlowJSON = (context: {}) => {
        return dispatch(loadFlowJSONAction(context, zoom));
    };
    // const addMaster = (context: {}) => {
    //     dispatch(addMasterAction(context));
    // };
    const addStep = (add_step:StepModelType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => {
        dispatch(addStepAction(add_step, src_step_ids, dst_step_ids, zoom));
    };
    const updateStep = (step: StepModelType) => {
        dispatch(updateStepAction(step, zoom));
    };
    const selectSteps = (selected_steps: []) => {
        dispatch(selectStepsAction(selected_steps));
    };
    const addSelectStep = (selected_step_id: string) => {
        dispatch(addSelectStepAction(selected_step_id));
    };
    const deleteSelectStep = (selected_step_id: string) => {
        dispatch(deleteSelectStepAction(selected_step_id));
    };
    const deleteSteps = (step_ids: []) => {
        dispatch(deleteStepsAction(step_ids, zoom));
    };
    // const cutSteps = (step_ids: []) => {
    //     dispatch(cutStepsAction(step_ids));
    // };
    const addHistory = () => {
        dispatch(addHistoryAction());
    };
    const undo = () => {
        dispatch(undoAction(zoom));
    };
    const redo = () => {
        dispatch(redoAction(zoom));
    };
    // const executeFlow = (flowid: string) => {
    //     // flowidは未使用
    //     dispatch(executeFlowAction(flowid));
    // };
    // const updateDataFrameDetail = (detail: FrameType) => {
    //     dispatch(updateDataFrameDetailAction(detail));
    // };
    // const addNote = (x: number, y: number) => {
    //     dispatch(addNoteAction(x, y));
    // };
    const moveSteps = (x: number, y: number, step) => {
        dispatch(moveStepsAction(x, y, step, zoom));
    };
    // const setExecuteMode = (mode: FlowExecuteModeValue) => {
    //     dispatch(setExecuteModeAction(mode));
    // };
    // const setEditMode = (mode: FlowEditModeValue) => {
    //     dispatch(setEditModeAction(mode));
    // };
    // const refreshCanvasSize = () => {
    //     dispatch(refreshCanvasSizeAction());
    // };
    const updateLastSavedFlow = () => {
        dispatch(updateLastSavedFlowAction());
    };

    const {notifySuccess, notifyLoading, notifyWarning, notifyError, dismissNotify} = useStreamCatNotifications();
    const {notifyComplete, notifySaveAs} = useStreamCatFlowNotification();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [readOnly, setReadOnly] = useState<boolean>(false);
    const [hasEnableAutoLockExtended, setHasEnableAutoLockExtended] = useState<boolean>(false);
    // const hasLockedUUID = useMemo(() => !!(lockUUID), [lockUUID]); // lockUUIDを保持している際は、編集可能な状態

    const [readLock] = useAsyncResource(getLock, inject_flow_uuid);
    const [lock, setLock] = useState<LockType | ErrorResponse>(readLock());

    const [saveAsFlowName, setSaveAsFlowName] = useState<string>();
    const [hasShowSaveAsFlowModal, setHasShowSaveAsFlowModal] = useState<boolean>(false);
    const [hasShowConfirmReloadFlowModal, setHasShowConfirmReloadFlowModal] = useState<boolean>(false);

    useEffect(() => {
        if (!hasShowSaveAsFlowModal) return;
        ModalUtil.registerModal({
            id: Constants.modal.SAVE_AS_FLOW, onClickDone: async () => {
                if (!saveAsFlowName || !saveAsFlowName.length) {
                    alert("フロー名を指定してください")
                } else {
                    // フローを別名保存する
                    Api.findFolder(folderUuid as string).then(folder => {
                        // 現在のフォルダに別名フローを新規作成する
                        folder.createFlow(saveAsFlowName).then(anotherFlow => {
                            // 別名保存するための現在表示されている flow
                            const targetFlow = flow as FlowType;
                            targetFlow.label = saveAsFlowName;
                            // 別名保存時は、新しいフロー（別名フロー）のロックを取得する
                            Api.createLock(anotherFlow.uuid).then(lock => {
                                // 新規に作成した newFlow の uuid を設定して保存する
                                saveAnotherFlowPromise(targetFlow, anotherFlow, lock.uuid).then(() => {
                                    // 転移する前にnewFlowのロックは一度解除する
                                    lock.delete();
                                    // 保存後に作成したフローに遷移する
                                    WebUtil.navigateURL(WebUtil.webURL("/flows/" + anotherFlow.uuid, true));
                                });
                            });
                        });
                    });
                }
            }, onClickCancel: () => {
                setHasEnableAutoLockExtended(true);
                setHasShowSaveAsFlowModal(false);
                ModalUtil.closeModal(Constants.modal.SAVE_AS_FLOW)
            }
        })
        ModalUtil.emitModal({
            id: Constants.modal.SAVE_AS_FLOW,
            visible: true,
            done: '別名で保存する',
            danger: false,
            content: <div>
                <TextField placeholder={'別名保存するフロー名'}
                    onChange={(e) => setSaveAsFlowName(e.target.value)} />
            </div>,
        })
    }, [hasShowSaveAsFlowModal, saveAsFlowName, flow]);

    useEffect(() => {
        if (!hasShowConfirmReloadFlowModal) return;
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM_RELOAD_FLOW, onClickDone: () => {
                location.reload();
                ModalUtil.closeModal(Constants.modal.CONFIRM_RELOAD_FLOW);
            }, onClickCancel: () => {
                setHasEnableAutoLockExtended(true);
                setHasShowConfirmReloadFlowModal(false);
                ModalUtil.closeModal(Constants.modal.CONFIRM_RELOAD_FLOW)
            }
        })
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM_RELOAD_FLOW,
            visible: true,
            done: '現在のフローを破棄して再読込み',
            danger: true,
            content: <div>
                現在の編集中のフローを破棄してフローを再読込みしますがよろしいですか？
            </div>,
        })
    }, [hasShowConfirmReloadFlowModal]);

    // useEffect(() => {
    //     if (initialEditMode === null) {
    //         setInitialEditMode(editMode);
    //     }
    // }, [editMode]);

    useEffect(() => {
        if (networkStatus === NetworkStatusValue.Online) {
            if (offLineNotificationId) {
                dismissNotify(offLineNotificationId);
                notifySuccess('ネットワークに再接続しています');
                setOffLineNotificationId(null);
                // ロックを延長する
                extendLock(lock);
            }
        } else if (networkStatus === NetworkStatusValue.Offline) {
            const offLineNotificationId = notifyWarning('現在ネットワークがオフラインです', 'ネットワークの状態を確認してください');
            setOffLineNotificationId(offLineNotificationId);
        }
    }, [networkStatus, lock]);

    useEffect(() => {
        // Canvasのサイズを変更する
        setCanvasWidth(window.innerWidth - inspectorWidth);
        // Windowサイズの変更時にCanvasのサイズを変更する
        window.onresize = () => {
            setCanvasWidth(window.innerWidth - inspectorWidth);
        };
    }, [inspectorWidth]);

    useEffect(() => {
        const handleLeavePage = (e) => {
            e.preventDefault();
            let dialogText
            let isSame = _.isEqual(flow, lastSavedFlow)
            if (!isSame) {
                dialogText = 'Dialog text here'; // カスタムメッセージは動作しない（Chrome）
                e.returnValue = dialogText;
            }
            return dialogText;
        };

        // タブが閉じられた時にロックを解除する
        const handleUnload = (e) => {
            if(lock instanceof ErrorResponse){
                return;
            }
            // ・Pageを閉じる時はnavigator.sendBeacon()を用いないとAPIが発行できない(ただしmacOSのChromeは発行できるようだ)
            // ・navigator.sendBeacon()はPOSTしか発行できないので、POSTでロックを解除する
            lock && navigator.sendBeacon(`/api/v0/delete-locks/${lock.uuid}`);
        }

        // ・visibilitychangeイベントはFirefoxとSafariでは機能しなかった
        // ・document.addEventListener()へのイベントハンドラの登録では
        //   Pageを閉じる時にイベントハンドラが実行されなかった
        window.addEventListener("beforeunload", handleLeavePage);
        window.addEventListener("unload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleLeavePage);
            window.removeEventListener("unload", handleUnload);
        }
    }, [lock, flow, lastSavedFlow]);

    useEffect(() => {
        // 排他ロックが取得できなかった場合は警告メッセージを表示する
        if(lock instanceof ErrorResponse){
            notifyWarning('警告：読取専用フロー', lock.message)
        }
    }, []);

    useEffect(() => {
        const preRequest :Promise<{}>[] = [];

        // サブフローの一覧を取得する
        preRequest.push(
            Api.findSubflows().then(subflows => {
                const subflowModels = subflows.map(subflow => new SubflowCommandModel(subflow));
                window.subflows = subflowModels;
                // addMaster({ subflows: subflowModels });
                return {
                    subflows: subflowModels
                };
            })
        );

        // データソースの一覧を取得する
        preRequest.push(
            Api.findDataSrcs().then(datasrcs => {
                // addMaster({ datasrcs: datasrcs });
                return {
                    datasrcs: datasrcs
                };
            })
        );

        // データデストの一覧を取得する
        preRequest.push(
            Api.findDataDsts().then(datadsts => {
                // addMaster({ datadsts: datadsts });
                return {
                    datadsts: datadsts
                };
            })
        );

        // Commandの一覧を取得する
        preRequest.push(
            Api.findCommands().then(commands => {
                const commandModels = commands.map(command => new CommandModel(command as any));
                window.commands = commandModels;
                // addMaster({ commands: commandModels });
                return {
                    commands: commandModels
                };
            })
        );

        // VCommandの一覧を取得する
        preRequest.push(
            Api.findVCommands().then(visualizers => {
                const visualizerModels = visualizers.map(visualizer => new VisualizeModel(visualizer));
                window.visualizers = visualizerModels;
                // addMaster({ visualizers: visualizerModels });
                return {
                    visualizers: visualizerModels
                };
            })
        );

        Promise.all(preRequest).then((runnablesFragments) => {
            // 全てのrunnableを取得した後に、状態変数runnablesにその取得結果を格納する
            setRunnables({
                ...runnables,
                ...runnablesFragments[0],
                ...runnablesFragments[1],
                ...runnablesFragments[2],
                ...runnablesFragments[3],
                ...runnablesFragments[4],
            });
            // フローJSONの解析(loadFlowJSON)で、Subflows, Commands, Visualizersを参照するので
            // これらを取得した後に、findFlowを実行する
            return Api.findFlow(inject_flow_uuid).then(flow => {
                // HTML headのtitleにフロー名を設定する
                // アイコンの候補: 📝📃📄🖋🖊🔧🍴📐🔨🔧🛠⚒
                document.title = "📐" + flow.label;
                // フローJSONを解析する
                loadFlowJSON(flow);
                // 編集ロックされたフローの場合は通知する
                if (flow.editLock) {
                    notifyWarning('警告：読取専用フロー', 'このフローは編集ロック中のため、 編集権限が取得できませんでした');
                }
                return flow.allowlist;
            });
        }).then(allowlist => {
            // 実行モードの設定
            const executeMode = (allowlist.execute) ? FlowExecuteModeValue.Executable : FlowExecuteModeValue.NotExecutable;
            setExecuteMode(executeMode);
            // 編集モードの設定
            if (!allowlist.read) {
                // read が無効な場合は NotAllowed に飛ばす
                setEditMode(FlowEditModeValue.NotAllowed)
                setIsLoading(false);
                return;
            }
            if (!allowlist.update) {
                // update が無効な場合は、排他ロックの取得を行ずに [読み取り専用モード1] にする
                setEditMode(FlowEditModeValue.ReadOnlyUpdateDisabled)
                setIsLoading(false);
                return;
            }
            // update が有効な場合は、排他ロックを取得する
            getNewLockUUID();
        }).catch((error) => {
            console.log(error);
        });

        // ブラウザバックによってブラウザタブを閉じれるように設定する
        WebUtil.setCloseWindowOnBack();

    }, []);

    // 初回レンダリング時のみ実行する
    useEffect(() => {
        const getNavigatorNetworkStatus = () => {
            if(navigator.onLine){
                return NetworkStatusValue.Online;
            }else{
                return NetworkStatusValue.Offline;
            }
        }
        // 現在のネットワーク接続状態を設定する
        setNetworkStatus(getNavigatorNetworkStatus());
        // オンライン復帰時のイベントハンドラを設定する
        window.addEventListener("online", () => setNetworkStatus(getNavigatorNetworkStatus()));
        // ネットワーク切断時のイベントハンドラを設定する
        window.addEventListener("offline", () => setNetworkStatus(getNavigatorNetworkStatus()));
    }, []);

    const extendLockInterval: number = inject_lock_interval ? inject_lock_interval : 1000 * 60 * 1; // 1分ごとに延長
    useInterval(() => {;
        if(lock instanceof ErrorResponse){
            return;
        }else if(hasEnableAutoLockExtended && networkStatus !== NetworkStatusValue.Offline){
            extendLock(lock);
        }
    }, extendLockInterval);

    // 現在表示中のフローの保存処理
    const saveFlowPromise = (targetFlow: FlowType) => {
        // newLockUUIDがあれば、別名保存として判断する
        const notificationId = notifyLoading('フロー保存中', 'フローの設定を保存しています');
        targetFlow.flow.nodes = nodes;
        
        return new Promise<FlowType>(async (reslove, reject) => {
            // 編集権限がないと、保存不可
            if (lock instanceof ErrorResponse) {
                reject(new MessageModel({
                    title: "警告：読取専用フロー",
                    message: "このフローはすでに編集中のため、 編集権限が取得できませんでした。",
                    messageStatus: "warning"
                }));
            } else {
                // フロー保存
                return await targetFlow.update(flow!.flow, lock.uuid).then(flow => {
                    updateLastSavedFlow();
                    // resolve()を呼ばないと以降のPromiseチェーンが起動しない
                    reslove(flow);
                    return flow;
                }).catch(e => {
                    reject(new MessageModel({
                        title: "フロー保存エラー",
                        message: e.message,
                        messageStatus: "error"
                    }));
                }).finally(() => {
                    dismissNotify(notificationId);
                });
            }
        }).catch(e => {
            // 保存失敗した場合、エラーメッセージ出力
            notifyError(e.title, e.message);
        });
    };

    const saveAnotherFlowPromise = (targetFlow:FlowType, anotherFlow:FlowType, newLockUUID:string) => {
        const notificationId = notifyLoading('フロー保存中', 'フローの設定を保存しています');
        targetFlow.flow.nodes = nodes;

        return new Promise(async (reslove, reject) => {
            // フロー保存
            anotherFlow.update(flow!.flow, newLockUUID).then(flow => {
                updateLastSavedFlow();
                // resolve()を呼ばないと以降のPromiseチェーンが起動しない
                reslove(flow);
                return flow;
            }).catch(e => {
                reject(new MessageModel({
                    title: "フロー保存エラー",
                    message: e.message,
                    messageStatus: "error"
                }));
            }).finally(() => {
                dismissNotify(notificationId);
            });
        }).catch(e => {
            // 保存失敗した場合、エラーメッセージ出力
            notifyError(e.title, e.message);
        });
    };

    const onClickSaveFlow = () => {
        const targetFlow = flow as FlowType;
        return saveFlowPromise(targetFlow).then(flow => {
            if(!flow){
                return flow;
            }
            setModifiedAt(flow.modifiedAt);
            return flow;
        });
    }

    /**
     * lock の延長処理
     * @param lockUUID
     */
    const extendLock = (lock: LockType|ErrorResponse) => {
        if (lock instanceof ErrorResponse){
            return;
        }
        // 延長処理
        lock.extend().then(() => {
            // 取得した lockUUID を設定
            setLock(lock);
        }).catch(e => {
            // 編集中通知API に失敗した場合は、排他ロックを新規に再取得する
            regenerateNewLockUUID();
            setReadOnly(true);
        }).finally(() => {
            setIsLoading(false);
        });
    }

    /**
     * lock の再取得処理
     */
    const regenerateNewLockUUID = () => {
        // 取得処理
        Api.createLock(inject_flow_uuid, modifiedAt).then(lock => {
                setLock(lock);
                // モードは変更せずに ReadOnly だけオフにする
                setReadOnly(false);
        }).catch(e => {
            const onClickSaveAs = () => {
                setHasShowSaveAsFlowModal(true);
                return false;
            };
            const onClickReload = () => {
                setHasShowConfirmReloadFlowModal(true);
                return false;
            };
            notifySaveAs('フローが編集できません', e.message, onClickSaveAs, onClickReload);
            // モードは変更せずに ReadOnly だけオンにする
            setReadOnly(true);
            setHasEnableAutoLockExtended(false);
            // 通知したら自動排他ロックは解除する
        }).finally(() => {
            setIsLoading(false);
        });
    }

    /**
     * lock の新規取得
     */
    const getNewLockUUID = () => {
        if(lock instanceof ErrorResponse){
            setReadOnly(true);
            // ロック失敗 => [読み取り専用モード2]
            setEditMode(FlowEditModeValue.ReadOnlyLocked);
            setHasEnableAutoLockExtended(false);
        }else{
            setEditMode(FlowEditModeValue.Editable)
            // ロックの自動更新を有効にする
            setHasEnableAutoLockExtended(true);
        }
        setIsLoading(false);
    }    

    const renderSteps = useCallback(() => {
        let steps: any = [];
        if (Array.isArray(nodes)) {
            steps = nodes.map((step: StepModelType) => {
                let selected = (step.id === selected_step_ids[0]);
                const stepReadOnly = !(editMode === FlowEditModeValue.Editable) || networkStatus === NetworkStatusValue.Offline || readOnly ;
                return <Step
                    key={step.id}
                    model={step}
                    position={step.position}
                    type={step.type}
                    selected={selected}
                    text={step.text}
                    invalid={step.invalid}
                    error={step.error}
                    runnables={runnables}
                    flow={flow!}
                    selected_step_ids={selected_step_ids}
                    zoom={zoom}
                    dragRange={dragRange}
                    addSelectStep={addSelectStep}
                    deleteSelectStep={deleteSelectStep}
                    selectSteps={selectSteps}
                    selectFrame={frame => setSelectedFrame(frame)}
                    updateStep={updateStep}
                    moveSteps={moveSteps}
                    readOnly={stepReadOnly}
                />;
            });
        }
        return steps;
    }, [nodes,
        selected_step_ids,
        runnables,
        flow,
        zoom,
        dragRange,
        addSelectStep,
        deleteSelectStep,
        selectSteps,
        updateStep,
        moveSteps]);

    const renderEdges = useCallback(() => {
        let edges: any = [];
        if (Array.isArray(graph.edges)) {
            graph.edges.forEach((edge, index) => {
                const v_node = GraphUtil.getNode(nodes, edge.v); // 入力元ノード
                const w_node = GraphUtil.getNode(nodes, edge.w); // 出力元ノード

                if (v_node && w_node) {
                    const vx = v_node.position.x +
                        Constants.default.datasource.width / 2;
                    const vy = v_node.position.y +
                        Constants.default.datasource.height / 2;
                    const wx = w_node.position.x +
                        Constants.default.operator.width / 2;
                    const wy = w_node.position.y +
                        Constants.default.operator.height / 2;
                    let outPortLabel; // 入力元ノードからの出力ポートラベル
                    let inPortLabel;  // 出力元ノードからの入力ポートラベル
                    //出力先ノードがDataFrameの場合のみ出力もとにラベルを付与する
                    if (w_node instanceof DataFrameStepModel) {
                        outPortLabel = JSON.parse(edge.name).port_name;
                    }
                    //入力元ノードがDataFrameの場合のみ出力もとにラベルを付与する
                    if (v_node instanceof DataFrameStepModel) {
                        inPortLabel = JSON.parse(edge.name).port_name;
                    }

                    let e = <Edge outPortLabel={outPortLabel} inPortLabel={inPortLabel} vx={vx} vy={vy} wx={wx} wy={wy}
                        key={index} />;
                    edges.push(e);
                }
            });
        }
        
        return edges;
    }, [graph, nodes]);

    const renderSelector = useCallback(() => {
        let selector: any = null;
        if(dragRange!==null){
            selector = <Selector sx={ZoomUtil.zoomReverse(dragRange.start.x, zoom)}
                sy={ZoomUtil.zoomReverse(dragRange.start.y, zoom)}
                ex={ZoomUtil.zoomReverse(dragRange.end.x, zoom)}
                ey={ZoomUtil.zoomReverse(dragRange.end.y, zoom)} />;
        }
        return selector;
    }, [dragRange, zoom]);

    if (editMode === undefined || executeMode === undefined) {
        // モードが設定前はローディング中にする
        return <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={true} />
    } else if (editMode === FlowEditModeValue.NotAllowed) {
        // 利用できないモードの場合は、操作不可にする
        return <NotAllowed />
    }

    // 読み取り専用モードの場合は disabled にする
    // ☁️保存 ☁️データソース追加 💬メモ ↩︎もとに戻す ↪︎繰り返す の制御
    const baseToolBarDisabled = (editMode === FlowEditModeValue.ReadOnlyLocked ||
        editMode === FlowEditModeValue.ReadOnlyUpdateDisabled) || networkStatus === NetworkStatusValue.Offline || readOnly

    // 編集可能で実行可能な場合のみフロー以外は disabled にする
    // ▶︎このフローを実行の制御
    const runDisabled = !(executeMode === FlowExecuteModeValue.Executable && editMode === FlowEditModeValue.Editable) || networkStatus === NetworkStatusValue.Offline || readOnly

    // 実行可能で編集可能orUpdate可能以外の場合は、プレビュー機能を disabled にする
    // プレビューを開くリンクの制御
    const previewDisabled = !(executeMode === FlowExecuteModeValue.Executable && editMode === FlowEditModeValue.Editable) || networkStatus === NetworkStatusValue.Offline || readOnly

    // 編集モード以外は、フロー変数の追加機能を hidden にする
    const addFlowVariableHidden = !(editMode === FlowEditModeValue.Editable) || networkStatus === NetworkStatusValue.Offline || readOnly

    // 編集モード以外は、コマンドセレクター機能を hidden にする
    const commandSelectorHidden = !(editMode === FlowEditModeValue.Editable) || networkStatus === NetworkStatusValue.Offline || readOnly

    // 編集モード以外は、コマンド・データのペイン機能を disabled にする
    const baseInspectorDisabled = !(editMode === FlowEditModeValue.Editable) || networkStatus === NetworkStatusValue.Offline || readOnly

    const onClickRunFlowPromise = () => {
        return onClickSaveFlow();
    }

    // ロックのUUID(ロックの取得に失敗した場合はundefined)
    const lockUUID = (lock instanceof ErrorResponse)? undefined: lock.uuid;

    return <div className={style.flow_editor_container}>
        <div className={style.flow_editor}>
            {/* <PaperZoom /> */}
            <ToolBar
                zoomState={[zoom, setZoom]}
                lockUUID={lockUUID}
                nodes={nodes}
                history={history}
                notifyLoading={notifyLoading}
                notifiWarning={notifyWarning}
                notifyError={notifyError}
                notifyComplete={notifyComplete}
                dismissNotify={dismissNotify}
                addStep={addStep}
                addHistory={addHistory}
                undo={undo}
                redo={redo}
                baseDisabled={baseToolBarDisabled}
                runDisabled={runDisabled}
                onClickRunFlowPromise={onClickRunFlowPromise}
                onClickSaveFlow={onClickSaveFlow}
            />
            <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={isLoading}
                message={"フローを構築中です"} />
            <PaperScroller
                canvasWidth={canvasWidth}
                deleteSteps={deleteSteps}
                selectSteps={selectSteps}
                addHistory={addHistory}
                redo={redo}
                undo={undo}
                selected_step_ids={selected_step_ids}
                nodes={nodes}
                zoom={zoom}
                history={history}
                dragRangeState={[dragRange, setDragRange]}
            >
                <Paper graph={graph} zoom={zoom}>
                    {renderEdges()}
                    {renderSteps()}
                    {renderSelector()}
                </Paper>
            </PaperScroller>
            <Inspector
                selected_step_ids={selected_step_ids}
                nodes={nodes}
                runnables={runnables}
                zoom={zoom}
                addStep={addStep}
                selectSteps={selectSteps}
                flow={flow!}
                lockUUID={lockUUID}
                inspectorWidthState={[inspectorWidth, setInspectorWidth]}
                // selected_data_source_detail={selected_data_source_detail!}
                // updateDataFrameDetail={updateDataFrameDetail}
                selectedFrameState={[selectedFrame, setSelectedFrame]}
                deleteSteps={deleteSteps}
                addHistory={addHistory}
                updateStep={updateStep}
                refreshFlow={refreshFlowAction}
                addFlowVariableHidden={addFlowVariableHidden}
                previewDisabled={previewDisabled}
                commandSelectorHidden={commandSelectorHidden}
                baseInspectorDisabled={baseInspectorDisabled}
                updateLastSavedFlow={updateLastSavedFlow}
            />
            <NotificationManager />
        </div>
    </div>;
};

export { FlowEditor };
