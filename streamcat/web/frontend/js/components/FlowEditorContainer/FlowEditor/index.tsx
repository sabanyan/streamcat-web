import React, { useCallback, useEffect, useState } from 'react';
import { useAsyncResource } from 'use-async-resource';
import { PaperScroller } from 'FlowEditorContainer/PaperScroller';
import { Edge, Selector, Step } from 'Shared/SVG';
import {ToolBar} from 'FlowEditorContainer/ToolBar/Core';
import Constants from 'Constants/index';
import style from './style.scss';
import { Api } from 'Api';
import { GraphUtil, ZoomUtil, ModalUtil, StateUtil, FlowUtil} from 'Utils/index';
import CommandModel from 'Model/Command/CommandModel';
import { Loader } from 'Shared/Base';
import { DragType, GraphType, HistoryType, RunnablesType } from 'Types/index';
import { Inspector } from 'Shared/Inspector';
import { DataFrameStepModel, MessageModel, VisualizeModel } from 'Model/index';
import { NotificationManager, useStreamCatFlowNotification, useStreamCatNotifications } from 'Shared/Notification';
import {
    addStepAction,
    deleteStepsAction,
    graphUtil,
    rebuildNodesEdges,
    allRebuildNodesEdges
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
import { AllNodeType, Command, Flow, FlowType, FrameType } from 'Model/Library';


const getRunnables = () => {
    const preRequest :Promise<{}>[] = [];

    // サブフローの一覧を取得する
    preRequest.push(
        Api.findSubflows().then(subflows => {
            window.subflows = subflows;
            return {
                subflows: subflows
            };
        })
    );

    // データソースの一覧を取得する
    preRequest.push(
        Api.findDataSrcs().then(datasrcs => {
            return {
                datasrcs: datasrcs
            };
        })
    );

    // データデストの一覧を取得する
    preRequest.push(
        Api.findDataDsts().then(datadsts => {
            return {
                datadsts: datadsts
            };
        })
    );

    // Commandの一覧を取得する
    preRequest.push(
        Api.findCommands().then(commands => {
            window.commands = commands;
            return {
                commands: commands
            };
        })
    );

    // VCommandの一覧を取得する
    preRequest.push(
        Api.findVCommands().then(visualizers => {
            const visualizerModels = visualizers.map(visualizer => new VisualizeModel(visualizer));
            window.visualizers = visualizerModels;
            return {
                visualizers: visualizerModels
            };
        })
    );

    return Promise.all(preRequest).then((runnablesFragments) => {
        // 全てのrunnableを取得した後に、RunnablesType型の値に統合して返す
        return {
            ...runnablesFragments[0],
            ...runnablesFragments[1],
            ...runnablesFragments[2],
            ...runnablesFragments[3],
            ...runnablesFragments[4],
        } as RunnablesType;
    });
};

const getFlow = () => {
    return Api.findFlow(inject_flow_uuid);
};

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

    // ここでRunnableの取得を開始する
    const [runnablesReader] = useAsyncResource(getRunnables, []);
    // ここでFlowの取得を開始する
    const [flowReader] = useAsyncResource(getFlow, []);

    const dispatch = useDispatch();
    // const folderUuid = useSelector((state:State) => state.lastSavedFlow && state.lastSavedFlow.folderUuid);

    // const _modifiedAt = useSelector((state:State) => state.lastSavedFlow && state.lastSavedFlow.modifiedAt);
    // useEffect(() => {
    //     if (_modifiedAt) {
    //         // modifiedAt が reducer 経由での取得になる
    //         // 取得タイミングに差があるため取得ができ次第 State にセットする
    //         setModifiedAt(_modifiedAt);
    //     }
    // }, [_modifiedAt])
    // const [modifiedAt, setModifiedAt] = useState<string>();
    // const flowData = useSelector((state:State) => state.flowData);
    // const drag = useSelector((state:State) => state.drag);
    // const selected_step_ids = useSelector((state:State) => state.selected_step_ids);
    // const nodes = useSelector((state:State) => state.nodes);
    // const history = useSelector((state:State) => state.history);
    // const mast = useSelector((state:State) => state.mast);
    // const selected_data_source_detail = useSelector((state:State) => state.selected_data_source_detail);
    // const graph = useSelector((state:State) => state.graph);
    // const zoom = useSelector((state:State) => state.zoom);
    // const inspector = useSelector((state:State) => state.inspector);
    // const editor = useSelector((state:State) => state.editor);
    // const editMode = useSelector((state:State) => state.editMode);
    // const executeMode = useSelector((state:State) => state.executeMode);
    // const networkStatus = useSelector((state:State) => state.networkStatus);
    // const lastSavedFlow = useSelector((state:State) => state.lastSavedFlow);

    // runnable: FlowまたはCommandを表す
    const [runnables, setRunnables] = useState<RunnablesType>(runnablesReader);

    // 直近で保存したFlow
    const [lastSavedFlow, setLastSavedFlow] = useState<FlowType>(flowReader);

    // Canvasに表示するFlow
    const [flow, setFlow] = useState<FlowType>(flowReader);

    // 変更履歴
    const [history, setHistory] = useState<HistoryType>({
        current: -1,
        flows: []
    });

    const [graph, setGraph] = useState<GraphType>(graphUtil.getGraph(flow.flow.nodes, 100))

    // 選択中のStepのId
    const [selectedStepIds, setSelectedStepIds] = useState<string[]>([]);
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

    const loadFlowJSON = (flow: FlowType) => {
        const newFlowData = StateUtil.deepCopy(flow.flow);
        setHistory({
            current: 0,
            flows: [newFlowData]
        });
        // const {flow:newFlow} = dispatch(loadFlowJSONAction(flow, zoom));
        const flowData = graphUtil.load(flow.flow);
        setFlow({...flow, flow:flowData});
        setGraph(graphUtil.getGraph(flowData.nodes, zoom));
    };
    // const addMaster = (flow: {}) => {
    //     dispatch(addMasterAction(flow));
    // };
    const addStep = (add_step:AllNodeType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => {
        dispatch(addStepAction(flow.flow, add_step, src_step_ids, dst_step_ids, zoom));
        setFlow({...flow});
        setGraph(graphUtil.getGraph(flow.flow.nodes, zoom));
    };
    const updateStep = (step: AllNodeType) => {
        // dispatch(updateStepAction(flow.flow, step, zoom));
        flow.flow.nodes = rebuildNodesEdges(flow.flow.nodes, {step:step});
        setFlow({...flow});
        setGraph(graphUtil.getGraph(flow.flow.nodes, zoom));
    };
    const selectSteps = (selected_steps: any[]) => {
        // dispatch(selectStepsAction(selected_steps));
        setSelectedStepIds(
            selected_steps.map(step => step.id)
        );
    };
    const addSelectStep = (selected_step_id: string) => {
        // dispatch(addSelectStepAction(selected_step_id));
        setSelectedStepIds([...selectedStepIds, selected_step_id])
    };
    const deleteSelectStep = (selected_step_id: string) => {
        // dispatch(deleteSelectStepAction(selected_step_id));
        setSelectedStepIds(
            selectedStepIds.filter(stepId => stepId !== selected_step_id)
        );
    };
    const deleteSteps = (step_ids: string[]) => {
        dispatch(deleteStepsAction(flow.flow, step_ids, zoom));
        setFlow({...flow});
        setGraph(graphUtil.getGraph(flow.flow.nodes, zoom));
        //削除後は非選択状態にする
        setSelectedStepIds([]);
    };
    // const cutSteps = (step_ids: []) => {
    //     dispatch(cutStepsAction(step_ids));
    // };
    const addHistory = () => {
        const newFlowData = StateUtil.deepCopy(flow.flow);

        if (FlowUtil.isSameCurrentNodesToBeforeHistoryNodes(history, newFlowData)) {
            return;
        }

        if (history.current === history.flows.length - 1) {
            // newState.history.flows.push(flow);
            // newState.history.current = history.flows.length - 1;
            setHistory({
                current: history.flows.length,
                flows: [...history.flows, newFlowData]
            });
        } else {
            //前に戻っている状態で履歴が追加された場合は、
            //current以降の履歴は消す
            // newState.history.flows = history.flows.slice(0, history.current + 1);
            // newState.history.flows.push(flow);
            // newState.history.current = history.flows.length - 1;
            setHistory({
                current: history.current + 1,
                flows: [...history.flows.slice(0, history.current + 1), newFlowData]
            });
        }
    };
    const undo = () => {
        if (history.current > 0) {
            //一つ前に巻き戻し
            const prevFlowData = history.flows[history.current - 1];
            setHistory({
                current: history.current - 1,
                flows: history.flows
            });
            // dispatch(undoAction(prevFlowData, zoom));
            allRebuildNodesEdges(prevFlowData.nodes, graph.edges);
            (window as any).nodes = prevFlowData.nodes;
            setGraph(graphUtil.getGraph(prevFlowData.nodes, zoom));
            setFlow({...flow, flow:prevFlowData});
        }
    };
    const redo = () => {
        if (history.current < history.flows.length) {
            //一つ後に前送り
            const nextFlowData = history.flows[history.current + 1];
            setHistory({
                current: history.current + 1,
                flows: history.flows
            });
            // dispatch(redoAction(nextFlowData, zoom));
            allRebuildNodesEdges(nextFlowData.nodes, graph.edges);
            (window as any).nodes = nextFlowData.nodes;
            setGraph(graphUtil.getGraph(nextFlowData.nodes, zoom));
            setFlow({...flow, flow:nextFlowData});
        }
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
    const moveSteps = (flowData:Flow, x: number, y: number, step:AllNodeType, selectedStepIds:string[]) => {
        // dispatch(moveStepsAction(flowData, x, y, step, selectedStepIds, zoom));
        if (selectedStepIds.length > 0 && step) {
            const dx = (step.position.x - x);
            const dy = (step.position.y - y);
    
            flowData.nodes.map((node, index) => {
              if (selectedStepIds.includes(node.id)) {
                node.position.x = node.position.x - dx;
                node.position.y = node.position.y - dy;
              }
            });
            setGraph(graphUtil.getGraph(flowData.nodes, zoom));
        }
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
    // const updateLastSavedFlow = (lastSavedFlow:FlowType) => {
    //     dispatch(updateLastSavedFlowAction(lastSavedFlow));
    // };

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
                    Api.findFolder(lastSavedFlow.folderUuid as string).then(folder => {
                        // 現在のフォルダに別名フローを新規作成する
                        folder.createFlow(saveAsFlowName).then(anotherFlow => {
                            // 別名保存するための現在表示されている flow
                            const targetFlowData = flow.flow;
                            targetFlowData.label = saveAsFlowName;
                            // 別名保存時は、新しいフロー（別名フロー）のロックを取得する
                            Api.createLock(anotherFlow.uuid).then(lock => {
                                // 新規に作成した newFlow の uuid を設定して保存する
                                saveAnotherFlowPromise(targetFlowData, anotherFlow, lock.uuid).then(() => {
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
            let isSame = _.isEqual(flow.flow, lastSavedFlow.flow)
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
        // 
        // フローJSONの解析(loadFlowJSON)で、Subflows, Commands, Visualizersを参照するので
        // これらを取得した後に、findFlowを実行する
        // 
        // HTML headのtitleにフロー名を設定する
        // アイコンの候補: 📝📃📄🖋🖊🔧🍴📐🔨🔧🛠⚒
        document.title = "📐" + flow.label;
        // フローJSONを解析する
        loadFlowJSON(flow);
        // 直近で保存したFlowを保持する
        setLastSavedFlow(StateUtil.deepCopy(flow));
        // 編集ロックされたフローの場合は通知する
        if (flow.editLock) {
            notifyWarning('警告：読取専用フロー', 'このフローは編集ロック中のため、 編集権限が取得できませんでした');
        }
            
        // 実行モードの設定
        const executeMode = (flow.allowlist.execute) ? FlowExecuteModeValue.Executable : FlowExecuteModeValue.NotExecutable;
        setExecuteMode(executeMode);
        // 編集モードの設定
        if (!flow.allowlist.read) {
            // read が無効な場合は NotAllowed に飛ばす
            setEditMode(FlowEditModeValue.NotAllowed)
            setIsLoading(false);
            return;
        }
        if (!flow.allowlist.update) {
            // update が無効な場合は、排他ロックの取得を行ずに [読み取り専用モード1] にする
            setEditMode(FlowEditModeValue.ReadOnlyUpdateDisabled)
            setIsLoading(false);
            return;
        }
        // update が有効な場合は、排他ロックを取得する
        getNewLockUUID();

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
        // targetFlow.flow.nodes = nodes;
        
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
                return await targetFlow.update(flow.flow, lock.uuid).then(result => {
                    // FIXME: PUT /flow の戻り値にflow属性が含まれていない
                    setLastSavedFlow({...result, flow:flow.flow});
                    // resolve()を呼ばないと以降のPromiseチェーンが起動しない
                    reslove(result);
                    return result;
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

    const saveAnotherFlowPromise = (targetFlow:Flow, anotherFlow:FlowType, newLockUUID:string) => {
        const notificationId = notifyLoading('フロー保存中', 'フローの設定を保存しています');
        // targetFlow.nodes = nodes;

        return new Promise(async (reslove, reject) => {
            // フロー保存
            anotherFlow.update(flow.flow, newLockUUID).then(result => {
                // FIXME: PUT /flow の戻り値にflow属性が含まれていない
                setLastSavedFlow({...result, flow:flow.flow});
                // resolve()を呼ばないと以降のPromiseチェーンが起動しない
                reslove(result);
                return result;
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
        const targetFlow = lastSavedFlow as FlowType;
        return saveFlowPromise(targetFlow).then(flow => {
            if(!flow){
                return flow;
            }
            // setModifiedAt(flow.modifiedAt);
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
        Api.createLock(inject_flow_uuid, lastSavedFlow.modifiedAt).then(lock => {
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
        if (flow.flow.nodes) {
            steps = flow.flow.nodes.map((step: AllNodeType) => {
                let selected = (step.id === selectedStepIds[0]);
                const stepReadOnly = !(editMode === FlowEditModeValue.Editable) || networkStatus === NetworkStatusValue.Offline || readOnly ;
                return <Step
                    key={step.id}
                    model={step}
                    position={step.position}
                    type={step.type}
                    selected={selected}
                    invalid={step.invalid}
                    error={step.error}
                    runnables={runnables}
                    flowData={flow.flow}
                    selectedStepIds={selectedStepIds}
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
    }, [ //nodes,
        selectedStepIds,
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
        const edges:React.JSX.Element[] = [];
        if (Array.isArray(graph.edges)) {
            graph.edges.forEach((edge, index) => {
                const v_node = GraphUtil.getNode(flow.flow.nodes || [], edge.v); // 入力元ノード
                const w_node = GraphUtil.getNode(flow.flow.nodes || [], edge.w); // 出力元ノード

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
                    if (w_node.type === 'frame') {
                        outPortLabel = JSON.parse(edge.name).port_name;
                    }
                    //入力元ノードがDataFrameの場合のみ出力もとにラベルを付与する
                    if (v_node.type === 'frame') {
                        inPortLabel = JSON.parse(edge.name).port_name;
                    }

                    const e = <Edge outPortLabel={outPortLabel} inPortLabel={inPortLabel} vx={vx} vy={vy} wx={wx} wy={wy}
                        key={index} />;
                    edges.push(e);
                }
            });
        }
        
        return edges;
    }, [graph]);

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
                flowState={[flow, setFlow]}
                graphState={[graph, setGraph]}
                flowData={flow.flow}
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
                selectedStepIds={selectedStepIds}
                flowState={[flow, setFlow]}
                graphState={[graph, setGraph]}
                flowData={flow.flow}
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
                selectedStepIds={selectedStepIds}
                // nodes={flow?.nodes || []}
                runnables={runnables}
                zoom={zoom}
                addStep={addStep}
                selectSteps={selectSteps}
                flowState={[flow, setFlow]}
                graphState={[graph, setGraph]}
                flowData={flow.flow}
                lastSavedFlow={lastSavedFlow}
                lockUUID={lockUUID}
                inspectorWidthState={[inspectorWidth, setInspectorWidth]}
                // selected_data_source_detail={selected_data_source_detail!}
                // updateDataFrameDetail={updateDataFrameDetail}
                selectedFrameState={[selectedFrame, setSelectedFrame]}
                deleteSteps={deleteSteps}
                addHistory={addHistory}
                updateStep={updateStep}
                // refreshFlow={refreshFlowAction}
                addFlowVariableHidden={addFlowVariableHidden}
                previewDisabled={previewDisabled}
                commandSelectorHidden={commandSelectorHidden}
                baseInspectorDisabled={baseInspectorDisabled}
                updateLastSavedFlow={lastSavedFlow => setLastSavedFlow(lastSavedFlow)}
            />
            <NotificationManager />
        </div>
    </div>;
};

export { FlowEditor };
