import React, { useCallback, useEffect, useState } from 'react';
import { useAsyncResource } from 'use-async-resource';
import {SortEndHandler} from "react-sortable-hoc";
import { PaperScroller } from 'FlowEditorContainer/PaperScroller';
import { Edge, Selector, Step } from 'Shared/SVG';
import ToolBar from 'FlowEditorContainer/ToolBar/Core';
import Constants from 'Constants/index';
import style from './style.scss';
import { APIUtil2, GraphUtil, ZoomUtil, ModalUtil} from 'Utils/index';
import CommandModel from 'Model/Command/CommandModel';
import { Loader } from 'Shared/Base';
import { StepModelType } from 'Types/index';
import { Inspector } from 'Shared/Inspector';
import { DataFrameStepModel, MessageModel, SubflowCommandModel, VisualizeModel } from 'Model/index';
import { NotificationManager, useStreamCatFlowNotification, useStreamCatNotifications } from 'Shared/Notification';
import {
    addHistoryAction,
    addMasterAction,
    addSelectStepAction,
    addStepAction,
    addDataDstStepAction,
    addDataSrcStepAction,
    copyStepsAction,
    deleteCacheAction,
    deleteSelectStepAction,
    deleteStepsAction,
    dragEndAction,
    draggingAction,
    dragStartAction,
    loadFlowJSONAction,
    moveStepsAction,
    pasteStepsAction,
    redoAction,
    resizeInspectorAction,
    selectStepsAction,
    setEditModeAction,
    setExecuteModeAction,
    setZoomAction,
    sortFlowAction,
    sortStepSrcEndAction,
    undoAction,
    updateDataFrameDetailAction,
    updateFlowAction,
    updateStepAction,
    refreshCanvasSizeAction,
    refreshFlowAction,
    updateLastSavedFlowAction
} from 'Modules/flowEditor';
import { useDispatch, useSelector } from 'react-redux';
import { Paper } from 'FlowEditorContainer/Paper';
import { PaperZoom } from 'FlowEditorContainer/PaperZoom';
import { FlowEditModeValue, FlowExecuteModeValue, NetworkStatusValue } from 'Model/Flow/FlowModel';
import { NotAllowed } from 'Components/NotAllowedContainer';
import { TextField } from 'Shared/Input';
import useInterval from 'use-interval';
import WebUtil from "Utils/WebUtil";
import _ from 'lodash';
import { LockType } from 'Model/Locks';
import { ErrorResponse } from 'Utils/APIUtilBase';
import { FlowType, FrameType } from 'Model/Library';
import { LockAPI } from 'Utils/LockAPI';

const getLock = (targetUUID:string, notifyWarning:Function) => {
    return LockAPI.createLock(targetUUID).catch(e => {
        if(e instanceof Promise){
            // Web APIの応答待ちの場合はPromiseオブジェクトを再送出する
            throw e;
        }else if(e instanceof ErrorResponse) {
            notifyWarning('警告：読取専用フロー', 'このフローはすでに編集中のため、 編集権限が取得できませんでした');
        }else{
            notifyWarning(e.title, e.message);
        }
    });
}

const FlowEditor = () => {

    const dispatch = useDispatch();
    const folderUuid = useSelector((state: any) => state.FlowEditorReducer.folderUuid);

    const _modifiedAt = useSelector((state: any) => state.FlowEditorReducer.modifiedAt);
    useEffect(() => {
        if (_modifiedAt) {
            // modifiedAt が reducer 経由での取得になる
            // 取得タイミングに差があるため取得ができ次第 State にセットする
            setModifiedAt(_modifiedAt);
        }
    }, [_modifiedAt])
    const [modifiedAt, setModifiedAt] = useState<string>();
    const flow = useSelector<any, FlowType>((state: any) => state.FlowEditorReducer.flow);
    const drag = useSelector((state: any) => state.FlowEditorReducer.drag);
    const selected_step_ids = useSelector((state: any) => state.FlowEditorReducer.selected_step_ids);
    const nodes = useSelector((state: any) => state.FlowEditorReducer.nodes);
    const history = useSelector((state: any) => state.FlowEditorReducer.history);
    const mast = useSelector((state: any) => state.FlowEditorReducer.mast);
    const selected_tab_id = useSelector((state: any) => state.FlowEditorReducer.selected_tab_id);
    const selected_data_source_detail = useSelector((state: any) => state.FlowEditorReducer.selected_data_source_detail);
    const graph = useSelector((state: any) => state.FlowEditorReducer.graph);
    const zoom = useSelector((state: any) => state.FlowEditorReducer.zoom);
    const inspector = useSelector((state: any) => state.FlowEditorReducer.inspector);
    const editor = useSelector((state: any) => state.FlowEditorReducer.editor);
    const editMode = useSelector((state: any) => state.FlowEditorReducer.editMode);
    const executeMode = useSelector((state: any) => state.FlowEditorReducer.executeMode);
    const networkStatus = useSelector((state: any) => state.FlowEditorReducer.networkStatus);
    const lastSavedFlow = useSelector<any, FlowType>((state: any) => state.FlowEditorReducer.lastSavedFlow);

    const [offLineNotificationId, setOffLineNotificationId] = useState<string | null>(null);
    const [initialEditMode, setInitialEditMode] = useState<FlowEditModeValue | null>(null);

    const loadFlowJSON = useCallback((context: {}) => {
        return dispatch(loadFlowJSONAction(context));
    }, []);
    const addMaster = useCallback((context: {}) => {
        dispatch(addMasterAction(context));
    }, []);
    const addStep = useCallback((add_step: StepModelType, src_step_ids: [] = [], dst_step_ids: [] = []) => {
        dispatch(addStepAction(add_step, src_step_ids, dst_step_ids));
    }, []);
    const addDataDstStep = useCallback((dataDst: any, selectedDataNodeId: string) => {
        dispatch(addDataDstStepAction(dataDst, selectedDataNodeId));
    }, []);
    const addDataSrcStep = useCallback((dataSrc: any) => {
        dispatch(addDataSrcStepAction(dataSrc));
    }, []);
    const updateStep = useCallback((step: StepModelType) => {
        dispatch(updateStepAction(step));
    }, []);
    const updateFlow = useCallback((flow) => {
        dispatch(updateFlowAction(flow));
    }, []);
    const selectSteps = useCallback((selected_steps: []) => {
        dispatch(selectStepsAction(selected_steps));
    }, []);
    const addSelectStep = useCallback((selected_step_id: string) => {
        dispatch(addSelectStepAction(selected_step_id));
    }, []);
    const deleteSelectStep = useCallback((selected_step_id: string) => {
        dispatch(deleteSelectStepAction(selected_step_id));
    }, []);
    const deleteSteps = useCallback((step_ids: []) => {
        dispatch(deleteStepsAction(step_ids));
    }, []);
    const deleteCache = useCallback((selected_step_id: string) => {
        dispatch(deleteCacheAction(selected_step_id));
    }, []);
    // const cutSteps = useCallback((step_ids: []) => {
    //     dispatch(cutStepsAction(step_ids));
    // },[]);
    const copySteps = useCallback((step_ids: []) => {
        dispatch(copyStepsAction(step_ids));
    }, []);
    const pasteSteps = useCallback((paste_nodes: []) => {
        dispatch(pasteStepsAction(paste_nodes));
    }, []);
    const addHistory = useCallback(() => {
        dispatch(addHistoryAction());
    }, []);
    const undo = useCallback(() => {
        dispatch(undoAction());
    }, []);
    const redo = useCallback(() => {
        dispatch(redoAction());
    }, []);
    const sortFlow = useCallback(() => {
        dispatch(sortFlowAction());
    }, []);
    // const executeFlow = useCallback((flowid: string) => {
    //     // flowidは未使用
    //     dispatch(executeFlowAction(flowid));
    // },[]);
    // const selectTab = useCallback((tab_id: string) => {
    //     dispatch(selectTabAction(tab_id));
    // },[]);
    const dragStart = useCallback((x: number, y: number) => {
        dispatch(dragStartAction(x, y));
    }, []);
    const dragging = useCallback((x: number, y: number) => {
        dispatch(draggingAction(x, y));
    }, []);
    const dragEnd = useCallback((x: number, y: number) => {
        dispatch(dragEndAction(x, y));
    }, []);
    const setZoom = useCallback(({ offset, value }) => {
        dispatch(setZoomAction({ offset, value }));
    }, []);
    const updateDataFrameDetail = useCallback((detail: FrameType) => {
        dispatch(updateDataFrameDetailAction(detail));
    }, []);
    // const addNote = useCallback((x: number, y: number) => {
    //     dispatch(addNoteAction(x, y));
    // },[]);
    const sortStepSrcEnd = useCallback<SortEndHandler>((detail: {}, mouseEvent: {}) => {
        // mouseEventは未使用
        dispatch(sortStepSrcEndAction(detail, mouseEvent));
    }, []);
    const moveSteps = useCallback((x: number, y: number, step) => {
        dispatch(moveStepsAction(x, y, step));
    }, []);
    const resizeInspector = useCallback((width: number) => {
        dispatch(resizeInspectorAction(width));
    }, []);
    const setExecuteMode = useCallback((mode: FlowExecuteModeValue) => {
        dispatch(setExecuteModeAction(mode));
    }, []);
    const setEditMode = useCallback((mode: FlowEditModeValue) => {
        dispatch(setEditModeAction(mode));
    }, []);
    const refreshCanvasSize = useCallback(() => {
        dispatch(refreshCanvasSizeAction());
    }, []);
    const refreshFlow = useCallback((context) => {
        dispatch(refreshFlowAction(context));
    }, []);
    const updateLastSavedFlow = useCallback(() => {
        dispatch(updateLastSavedFlowAction());
    }, []);

    const {notifySuccess, notifyLoading, notifyWarning, notifyError, dismissNotify} = useStreamCatNotifications();
    const {notifyComplete, notifySaveAs} = useStreamCatFlowNotification();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [readOnly, setReadOnly] = useState<boolean>(false);
    const [hasEnableAutoLockExtended, setHasEnableAutoLockExtended] = useState<boolean>(false);
    // const hasLockedUUID = useMemo(() => !!(lockUUID), [lockUUID]); // lockUUIDを保持している際は、編集可能な状態

    const [readLock] = useAsyncResource(getLock, inject_flow_uuid, notifyWarning);
    const [lock, setLock] = useState(readLock());

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
                    APIUtil2.findFolder(folderUuid).then(folder => {
                        // 現在のフォルダに別名フローを新規作成する
                        folder.createFlow(saveAsFlowName).then(anotherFlow => {
                            // 別名保存するための現在表示されている flow
                            const targetFlow = flow;
                            targetFlow.label = saveAsFlowName;
                            // 別名保存時は、新しいフロー（別名フロー）のロックを取得する
                            LockAPI.createLock(anotherFlow.uuid).then(lock => {
                                // 新規に作成した newFlow の uuid を設定して保存する
                                saveAnotherFlowPromise(targetFlow, anotherFlow, lock.uuid).then(() => {
                                    // 転移する前にnewFlowのロックは一度解除する
                                    lock.delete();
                                    // 保存後に作成したフローに遷移する
                                    WebUtil.navigateURL(WebUtil.webURL("/flows/" + anotherFlow.uuid));
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

    useEffect(() => {
        if (initialEditMode === null) {
            setInitialEditMode(editMode);
        }
    }, [editMode]);

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

    // 現在表示中のフローの保存処理
    const saveFlowPromise = (targetFlow: FlowType) => {
        // newLockUUIDがあれば、別名保存として判断する
        const notificationId = notifyLoading('フロー保存中', 'フローの設定を保存しています');
        targetFlow.flow.nodes = nodes;
        
        return new Promise<FlowType>(async (reslove, reject) => {
            // 編集権限がないと、保存不可
            if (!lock) {
                reject(new MessageModel({
                    title: "警告：読取専用フロー",
                    message: "このフローはすでに編集中のため、 編集権限が取得できませんでした。",
                    messageStatus: "warning"
                }));
            } else {
                //　フロー保存
                return await targetFlow.update(flow.flow, lock.uuid).then(flow => {
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
            //　フロー保存
            anotherFlow.update(flow.flow, newLockUUID).then(flow => {
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
        const targetFlow = flow;
        return saveFlowPromise(targetFlow).then(flow => {
            if(!flow){
                return flow;
            }
            setModifiedAt(flow.modifiedAt);
            return flow;
        });
    }

    /**
     * lock の再取得処理
     */
    const regenerateNewLockUUID = () => {
        // 取得処理
        LockAPI.createLock(inject_flow_uuid, modifiedAt).then(lock => {
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
        if(lock){
            setEditMode(FlowEditModeValue.Editable)
            // ロックの自動更新を有効にする
            setHasEnableAutoLockExtended(true);
        }else{
            setReadOnly(true);
            // ロック失敗 => [読み取り専用モード2]
            setEditMode(FlowEditModeValue.ReadOnlyLocked);
            setHasEnableAutoLockExtended(false);
        }
        setIsLoading(false);
    }    

    /**
     * lock の延長処理
     * @param lockUUID
     */
    const extendLock = (lock: LockType|void) => {
        if (!lock) return;

        // 延長処理
        lock.extend().then( () => {
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

    const extendLockInterval: number = inject_lock_interval ? inject_lock_interval : 1000 * 60 * 1; // 1分ごとに延長
    useInterval(() => {
        if (lock && hasEnableAutoLockExtended && networkStatus !== NetworkStatusValue.Offline) {
            extendLock(lock)
        }
    }, extendLockInterval);

    useEffect(() => {
        window.onresize = () => {
            refreshCanvasSize();
        }
    }, [refreshCanvasSize]);

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
        const handleUnload = (e) =>{
            // ・Pageを閉じる時はnavigator.sendBeacon()を用いないとAPIが発行できない(ただしmacOSのChromeは発行できるようだ)
            // ・navigator.sendBeacon()はPOSTしか発行できないので、POSTでロックを解除する
            lock && navigator.sendBeacon(`/api/v0/delete-locks/${lock.uuid}`)
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
        const preRequest :Promise<any>[] = [];

        // サブフローの一覧を取得する
        preRequest.push(
            APIUtil2.findSubflows().then(subflows => {
                const subflowModels = subflows.map(subflow => new SubflowCommandModel(subflow));
                window.subflows = subflowModels;
                addMaster({ subflows: subflowModels });
            })
        );

        // データソースの一覧を取得する
        preRequest.push(
            APIUtil2.findDataSrcs().then(datasrcs => {
                addMaster({ datasrcs: datasrcs });
            })
        );

        // データデストの一覧を取得する
        preRequest.push(
            APIUtil2.findDataDsts().then(datadsts => {
                addMaster({ datadsts: datadsts });
            })
        );

        // Commandの一覧を取得する
        preRequest.push(
            APIUtil2.findCommands().then(commands => {
                const commandModels = commands.map(command => new CommandModel(command as any));
                window.commands = commandModels;
                addMaster({ commands: commandModels });
            })
        );

        // VCommandの一覧を取得する
        preRequest.push(
            APIUtil2.findVCommands().then(visualizers => {
                const visualizerModels = visualizers.map(visualizer => new VisualizeModel(visualizer));
                window.visualizers = visualizerModels;
                addMaster({ visualizers: visualizerModels });
            })
        );

        Promise.all(preRequest).then(() => {
            // フローJSONの解析(loadFlowJSON)で、Subflows, Commands, Visualizersを参照するので
            // これらを取得した後に、findFlowを実行する
            return APIUtil2.findFlow(inject_flow_uuid).then(flow => {
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

    }, []);

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
                    mast={mast}
                    flow={flow}
                    selected_step_ids={selected_step_ids}
                    zoom={zoom}
                    drag={drag}
                    addSelectStep={addSelectStep}
                    deleteSelectStep={deleteSelectStep}
                    selectSteps={selectSteps}
                    updateDataFrameDetail={updateDataFrameDetail}
                    updateStep={updateStep}
                    moveSteps={moveSteps}
                    readOnly={stepReadOnly}
                />;
            });
        }
        return steps;
    }, [nodes,
        selected_step_ids,
        mast,
        flow,
        zoom,
        drag,
        addSelectStep,
        deleteSelectStep,
        selectSteps,
        updateDataFrameDetail,
        updateStep,
        moveSteps]);

    const renderEdges = useCallback(() => {
        let edges: any = [];
        if (Array.isArray(graph.edges)) {
            graph.edges.forEach((edge, index) => {
                const v_node = GraphUtil.getNode(nodes, edge.v);　// 入力元ノード
                const w_node = GraphUtil.getNode(nodes, edge.w);　// 出力元ノード

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
                    let inPortLabel;　// 出力元ノードからの入力ポートラベル
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
        if (Object.keys(drag).length) {
            selector = <Selector sx={ZoomUtil.zoomReverse(drag.start.x, zoom)}
                sy={ZoomUtil.zoomReverse(drag.start.y, zoom)}
                ex={ZoomUtil.zoomReverse(drag.end.x, zoom)}
                ey={ZoomUtil.zoomReverse(drag.end.y, zoom)} />;
        }
        return selector;
    }, [drag, zoom]);



    if (editMode === undefined || executeMode === undefined) {
        // モードが設定前はローディング中にする
        return <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={true} />
    } else if (editMode === FlowEditModeValue.NotAllowed) {
        // 利用できないモードの場合は、操作不可にする
        return <NotAllowed />
    }

    // 読み取り専用モードの場合は disabled にする
    // ☁️保存　☁️データソース追加　💬メモ　↩︎もとに戻す　↪︎繰り返す の制御
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

    return <div className={style.flow_editor_container}>
        <div className={style.flow_editor}>
            <PaperZoom />
            <ToolBar
                zoom={zoom}
                lockUUID={lock? lock.uuid: undefined}
                nodes={nodes}
                history={history}
                notifyLoading={notifyLoading}
                notifiWarning={notifyWarning}
                notifyError={notifyError}
                notifyComplete={notifyComplete}
                dismissNotify={dismissNotify}
                addStep={addStep}
                addHistory={addHistory}
                sortFlow={sortFlow}
                selectSteps={selectSteps}
                setZoom={setZoom}
                undo={undo}
                redo={redo}
                baseDisabled={baseToolBarDisabled}
                runDisabled={runDisabled}
                refreshFlow={refreshFlow}
                onClickRunFlowPromise={onClickRunFlowPromise}
                onClickSaveFlow={onClickSaveFlow}
            />
            <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={isLoading}
                message={"フローを構築中です"} />
            <PaperScroller
                editor={editor}
                pasteSteps={pasteSteps}
                copySteps={copySteps}
                deleteSteps={deleteSteps}
                selectSteps={selectSteps}
                dragStart={dragStart}
                dragging={dragging}
                dragEnd={dragEnd}
                addHistory={addHistory}
                redo={redo}
                undo={undo}
                selected_step_ids={selected_step_ids}
                nodes={nodes}
                history={history}
                drag={drag}
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
                mast={mast}
                selected_tab_id={selected_tab_id}
                addStep={addStep}
                addDataSrcStep={addDataSrcStep}
                addDataDstStep={addDataDstStep}
                selectSteps={selectSteps}
                flow={flow}
                lockUUID={lock? lock.uuid: undefined}
                inspector={inspector}
                updateFlow={updateFlow}
                selected_data_source_detail={selected_data_source_detail}
                updateDataFrameDetail={updateDataFrameDetail}
                deleteSteps={deleteSteps}
                addHistory={addHistory}
                deleteCache={deleteCache}
                updateStep={updateStep}
                sortStepSrcEnd={sortStepSrcEnd}
                resizeInspector={resizeInspector}
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
