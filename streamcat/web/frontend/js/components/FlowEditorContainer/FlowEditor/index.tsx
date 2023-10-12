import React, { useCallback, useEffect, useState } from 'react';
import { useAsyncResource } from 'use-async-resource';
import useInterval from 'use-interval';
import * as jsonpatch from 'fast-json-patch';
import style from './style.scss';
import { Api, ErrorResponse, NodeArray } from 'Api';
import { MessageModel } from 'Model/index';
import { LockType } from 'Model/Locks';
import { AllNodeType, Flow, FlowType, FrameType } from 'Model/Library';
import { FlowEditModeValue, FlowExecuteModeValue, Connectivity } from 'Model/Flow/FlowModel';
import Constants from 'Constants/index';
import { GraphUtil, ZoomUtil, ModalUtil, StateUtil, WebUtil} from 'Utils/index';
import { DragType, GraphType, RunnablesType } from 'Types/index';
import {
    NotificationManager,
    useStreamCatFlowNotification,
    useStreamCatNotifications
} from 'Shared/Notification';
import { Inspector } from 'Shared/Inspector';
import { Loader } from 'Shared/Base';
import { Edge, Selector, Step } from 'Shared/SVG';
import { TextField } from 'Shared/Input';
import { NotAllowed } from 'Components/NotAllowedContainer';
import { PaperScroller } from 'FlowEditorContainer/PaperScroller';
import { Paper } from 'FlowEditorContainer/Paper';
import { ToolBar } from 'FlowEditorContainer/ToolBar/Core';
import {
    addStepAction,
    deleteStepsAction,
    graphUtil,
    allRebuildNodesEdges
} from 'Modules/flowEditor';

const getRunnables = () => {
    const preRequest :Promise<{}>[] = [];

    // サブフローの一覧を取得する
    preRequest.push(
        Api.findSubflows().then(subflows => {
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
            return {
                commands: commands
            };
        })
    );

    // VCommandの一覧を取得する
    preRequest.push(
        Api.findVCommands().then(vcommands => {
            return {
                vcommands: vcommands
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

const getLock = (targetUUID:string, updatable:boolean) => {
    if(updatable){
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
    }else{
        // Flowの更新権限がない場合はロックの取得を試みない
        return Api.findNull();
    }
};

export const FlowEditor = () => {

    // ここでRunnableの取得を開始する
    // runnable: FlowまたはCommandを表す
    const [runnablesReader] = useAsyncResource(getRunnables, []);
    // ここでFlowの取得を開始する
    const [flowReader] = useAsyncResource(getFlow, []);

    const extendLockInterval: number = inject_lock_interval ? inject_lock_interval : 1000 * 60 * 1; // 1分ごとに延長
    useInterval(() => {;
        if(!lockIsAcquired){
            return;
        }else if(hasEnableAutoLockExtended && serverConnectivity !== Connectivity.Disconnected){
            extendLock(lock);
        }
    }, extendLockInterval);

    // 直近で保存したFlow
    const [lastSavedFlow, setLastSavedFlow] = useState<FlowType>(flowReader);

    // Canvasに表示するFlow
    const [flow, setFlow] = useState<FlowType>(flowReader);

    // 変更後のFlowに対する差分(履歴)を取得するための起点
    const [prevFlow, setPrevFlow] = useState<FlowType>({...flow, flow:flow.flow.clone()});

    // UndoとRedo用のStack
    const [undoStack,] = useState<jsonpatch.Operation[][]>([]);
    const [redoStack,] = useState<jsonpatch.Operation[][]>([]);

    const [graph, setGraph] = useState<GraphType>(graphUtil.getGraph(flow.flow.nodes, 100))

    // 選択中のStepのId
    const [selectedStepIds, setSelectedStepIds] = useState<string[]>([]);
    // 選択中のDataFrameNodeのFrame
    const [selectedFrame, setSelectedFrame] = useState<FrameType>();
    // Canvasでの選択範囲
    const [dragRange, setDragRange] = useState<DragType | null>(null);
    // Canvasの拡大率
    const [zoom, setZoom] = useState(100);

    const [readLock] = useAsyncResource(getLock, inject_flow_uuid, flow.allowlist.update);
    const [lock, setLock] = useState(readLock());

    // ネットワークの接続状態
    const [serverConnectivity, setServerConnectivity] = useState<Connectivity>(Connectivity.UnKnown);
    // ネットワークオフラインを通知するポップアップのId
    // (オンライン復帰時にポップアップを閉じるために一時保存する)
    const [offLineNotificationId, setOffLineNotificationId] = useState<string | null>(null);
    // const [initialEditMode, setInitialEditMode] = useState<FlowEditModeValue | null>(null);

    // Inspectorの横幅
    const [inspectorWidth, setInspectorWidth] = useState(Constants.default.inspector.width);
    // Canvasの横幅
    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - Constants.default.inspector.width);

    // 実行可否
    const executeMode = flow.allowlist.execute? FlowExecuteModeValue.Executable: FlowExecuteModeValue.NotExecutable;

    // ロックの取得に成功した場合はtrue
    const lockIsAcquired = !(lock instanceof ErrorResponse || lock===null);

    // 編集可否
    const editMode = 
        // read が無効な場合は NotAllowed に飛ばす
        !flow.allowlist.read? FlowEditModeValue.NotAllowed:
        // update が無効な場合は、排他ロックの取得を行ずに [読み取り専用モード1] にする
        !flow.allowlist.update? FlowEditModeValue.ReadOnlyUpdateDisabled:
        // ロックの取得に失敗 => [読み取り専用モード2]
        !lockIsAcquired? FlowEditModeValue.ReadOnlyLocked:
        // ロックの取得に成功
        FlowEditModeValue.Editable;

    const {notifySuccess, notifyLoading, notifyWarning, notifyError, dismissNotify} = useStreamCatNotifications();
    const {notifyComplete, notifySaveAs} = useStreamCatFlowNotification();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [readOnly, setReadOnly] = useState<boolean>(editMode!==FlowEditModeValue.Editable);
    const [hasEnableAutoLockExtended, setHasEnableAutoLockExtended] = useState<boolean>(editMode===FlowEditModeValue.Editable);
    // const hasLockedUUID = useMemo(() => !!(lockUUID), [lockUUID]); // lockUUIDを保持している際は、編集可能な状態

    const [saveAsFlowName, setSaveAsFlowName] = useState<string>();
    const [hasShowSaveAsFlowModal, setHasShowSaveAsFlowModal] = useState<boolean>(false);
    const [hasShowConfirmReloadFlowModal, setHasShowConfirmReloadFlowModal] = useState<boolean>(false);

    useEffect(() => {
        // 排他ロックが取得できなかった場合は警告メッセージを表示する
        // ロックを試みなかった場合(lock==null)はメッセージを表示しない
        if(!lockIsAcquired && lock){
            notifyWarning('警告：読取専用フロー', lock.message);
        }
    }, []);

    useEffect(() => {
        // 
        // フローJSONの解析(loadFlowJSON)で、Subflows, Commands, Visualizersを参照するので
        // これらを取得した後に、findFlowを実行する
        // 
        // HTML headのtitleにフロー名を設定する
        // アイコンの候補: 📝📃📄🖋🖊🔧🍴📐🔨🔧🛠⚒
        document.title = '📐' + flow.label;
        // フローJSONを解析する
        loadFlowJSON(flow);
        // 直近で保存したFlowを保持する
        setLastSavedFlow(StateUtil.deepCopy(flow));
        // 編集ロックされたフローの場合は通知する
        if (flow.editLock) {
            notifyWarning('警告：読取専用フロー', 'このフローは編集ロック中のため、 編集権限が取得できませんでした');
        }

        // ブラウザバックによってブラウザタブを閉じれるように設定する
        WebUtil.setCloseWindowOnBack();

        setIsLoading(false);
    }, []);

    // 初回レンダリング時のみ実行する
    useEffect(() => {
        const getNavigatorNetworkStatus = () => {
            if(navigator.onLine){
                // Webブラウザがネットワーク接続状態の場合
                return Connectivity.Connectable;
            }else{
                return Connectivity.Disconnected;
            }
        }

        const apServerIsLocal = location.hostname==='localhost' || location.hostname==='127.0.0.1';
        if(apServerIsLocal){
            // APサーバがWebブラウザと同じホストに存在する場合
            setServerConnectivity(Connectivity.Connectable);
        }else{
            // APサーバがWebブラウザと異なるホストに存在する場合
            // Webブラウザのネットーワーク切断復帰のイベントハンドラを設定する

            // 現在のネットワーク接続状態を設定する
            setServerConnectivity(getNavigatorNetworkStatus());
            // オンライン復帰時のイベントハンドラを設定する
            window.addEventListener('online', () => setServerConnectivity(getNavigatorNetworkStatus()));
            // ネットワーク切断時のイベントハンドラを設定する
            window.addEventListener('offline', () => setServerConnectivity(getNavigatorNetworkStatus()));
        }
    }, []);

    useEffect(() => {
        if (!hasShowSaveAsFlowModal) return;
        ModalUtil.registerModal({
            id: Constants.modal.SAVE_AS_FLOW, onClickDone: async () => {
                if (!saveAsFlowName || !saveAsFlowName.length) {
                    alert('フロー名を指定してください')
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
                                    WebUtil.navigateURL(WebUtil.webURL('/flows/' + anotherFlow.uuid, true));
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
        if (serverConnectivity === Connectivity.Connectable) {
            if (offLineNotificationId) {
                dismissNotify(offLineNotificationId);
                notifySuccess('ネットワークに再接続しています');
                setOffLineNotificationId(null);
                // ロックを延長する
                extendLock(lock);
            }
        } else if (serverConnectivity === Connectivity.Disconnected) {
            const offLineNotificationId = notifyWarning('現在ネットワークがオフラインです', 'ネットワークの状態を確認してください');
            setOffLineNotificationId(offLineNotificationId);
        }
    }, [serverConnectivity, lock]);

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
            // 画面表示中のFlowと最後に保存したFlowの差分を取得する
            const patches = compareFlowData(flow.flow, lastSavedFlow.flow);
            if(patches.length === 0){
                // 差分がない場合は警告ダイアログを表示しない
                return;
            }else{
                // 差分がある場合は警告ダイアログを表示する
                e.preventDefault();
                // カスタムメッセージは動作しない(Chrome)
                e.returnValue = 'Dialog text here'; 
                return e.returnValue;
            }
        };

        // タブが閉じられた時にロックを解除する
        const handleUnload = (e) => {
            if(!lockIsAcquired){
                return;
            }
            // ・Pageを閉じる時はnavigator.sendBeacon()を用いないとAPIが発行できない(ただしmacOSのChromeは発行できるようだ)
            // ・navigator.sendBeacon()はPOSTしか発行できないので、POSTでロックを解除する
            lock && navigator.sendBeacon(`/api/v0/delete-locks/${lock.uuid}`);
        }

        // ・visibilitychangeイベントはFirefoxとSafariでは機能しなかった
        // ・document.addEventListener()へのイベントハンドラの登録では
        //   Pageを閉じる時にイベントハンドラが実行されなかった
        window.addEventListener('beforeunload', handleLeavePage);
        window.addEventListener('unload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleLeavePage);
            window.removeEventListener('unload', handleUnload);
        }
    }, [lock, flow, lastSavedFlow]);

    const loadFlowJSON = (flow: FlowType) => {
        const flowData = graphUtil.load(flow.flow);
        setFlow({...flow, flow:flowData});
        setGraph(graphUtil.getGraph(flowData.nodes, zoom));
    };
    // const addMaster = (flow: {}) => {
    //     dispatch(addMasterAction(flow));
    // };
    const addStep = (add_step:AllNodeType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => {
        addStepAction(flow.flow, add_step, src_step_ids, dst_step_ids, runnablesReader(), zoom);
        setFlow({...flow});
        setGraph(graphUtil.getGraph(flow.flow.nodes, zoom));
    };
    const updateStep = (updatedNode: AllNodeType) => {
        // 更新後のNodeに置き換える
        flow.flow.nodes = flow.flow.nodes.map(node =>
            node.id === updatedNode.id? updatedNode: node
        );
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
        deleteStepsAction(flow.flow, step_ids);
        setFlow({...flow});
        setGraph(graphUtil.getGraph(flow.flow.nodes, zoom));
        //削除後は非選択状態にする
        setSelectedStepIds([]);
    };
    // const cutSteps = (step_ids: []) => {
    //     dispatch(cutStepsAction(step_ids));
    // };

    // FlowDataを比較する
    const compareFlowData =(flow1:Flow, flow2:Flow) => {
        // compareが出力する差分には関数の差分も含まれるためこれらを除外する
        return jsonpatch.compare(flow1, flow2).filter(patch => {
            if(patch.path === '/nodes/__allAPIFuncSet'){
                // ArrayCtor型オブジェクトが内部で使用するフラグは除外する
                return false;
            }else if(patch.op === 'replace' && typeof patch.value === 'function'){
                // 関数は差分として認識させない
                return false;
            }else{
                return true;
            }
        }).map(patch => {
            if(patch.path === '/nodes' && (patch.op === 'add' || patch.op === 'replace')){
                // nodes配列全体の置き換えの場合
                // patch.valueはプロパティ名が整数のオブジェクトが格納されるので、これをNodeArrayに変換する
                const nodes = Object.keys(patch.value).filter(key => Number.isInteger(+key)).map(key => patch.value[key]);
                patch.value = new NodeArray(nodes);
            }
            return patch;
        });
    };

    const addHistory = () => {
        // 変更前後のFlowを比較して差分を取得する
        const patches = compareFlowData(flow.flow, prevFlow.flow);
        
        // 差分が無ければ変更無しと看做し履歴に追加しない
        if(patches.length === 0){
            return;
        }

        // 新たな履歴を追加する場合はRedoスタックをクリアする
        redoStack.length = 0;

        // Undoスタックに履歴を追加する
        undoStack.push(patches);

        // 差分を保存した後、変更前のFlowと現在のFlowを同じにする
        setPrevFlow({...flow, flow:flow.flow.clone()});
    };
    const undo = () => {
        // Undoスタックから直近の履歴を取り出す
        const patches = undoStack.pop();

        // 履歴が無ければUndo処理をしない
        if(!patches){
            return;
        }

        // 現在のFlowを複製する
        const clonedFlowData = flow.flow.clone();

        // Canvasに表示中のFlowに差分を適用する
        // Patchの検証をしない：validateOperation=false
        // 複製を取らずPatch対象に適用する：mutateDocument=true
        const prevFlowData = jsonpatch.applyPatch(clonedFlowData, patches, false, true).newDocument;

        // Redo用の差分を作成してRedoスタックに乗せる
        const reversePatches = compareFlowData(prevFlowData, flow.flow);
        redoStack.push(reversePatches);

        // エッジを繋ぎ直す
        allRebuildNodesEdges(prevFlowData.nodes, graph.edges);
        // graphの更新
        setGraph(graphUtil.getGraph(prevFlowData.nodes, zoom));
        // Flowの更新
        setFlow({...flow, flow:prevFlowData});
        // 変更前のFlowと現在のFlowを同じにする
        setPrevFlow({...flow, flow:prevFlowData.clone()});
    };
    const redo = () => {
        // Rndoスタックから最新の履歴を取り出す
        const patches = redoStack.pop();

        // 履歴が無ければUndo処理をしない
        if(!patches){
            return;
        }

        // 現在のFlowを複製する
        const clonedFlowData = flow.flow.clone();

        // Canvasに表示中のFlowに差分を適用する
        const nextFlowData = jsonpatch.applyPatch(clonedFlowData, patches, false, true).newDocument;

        // Redo用の差分を作成してRedoスタックに乗せる
        const reversePatches = compareFlowData(nextFlowData, flow.flow);
        undoStack.push(reversePatches);

        // エッジを繋ぎ直す
        allRebuildNodesEdges(nextFlowData.nodes, graph.edges);
        // graphの更新
        setGraph(graphUtil.getGraph(nextFlowData.nodes, zoom));
        // flowの更新
        setFlow({...flow, flow:nextFlowData});
        // 変更前のFlowと現在のFlowを同じにする
        setPrevFlow({...flow, flow:nextFlowData.clone()});
    };

    // 現在表示中のフローの保存処理
    const saveFlowPromise = (targetFlow: FlowType) => {
        // newLockUUIDがあれば、別名保存として判断する
        const notificationId = notifyLoading('フロー保存中', 'フローの設定を保存しています');
        // targetFlow.flow.nodes = nodes;
        
        return new Promise<FlowType>(async (reslove, reject) => {
            // 編集権限がないと、保存不可
            if (!lockIsAcquired) {
                reject(new MessageModel({
                    title: '警告：読取専用フロー',
                    message: 'このフローはすでに編集中のため、 編集権限が取得できませんでした。',
                    messageStatus: 'warning'
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
                        title: 'フロー保存エラー',
                        message: e.message,
                        messageStatus: 'error'
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
                    title: 'フロー保存エラー',
                    message: e.message,
                    messageStatus: 'error'
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
        return saveFlowPromise(targetFlow);
    }

    /**
     * lock の延長処理
     * @param lockUUID
     */
    const extendLock = (lock: LockType|ErrorResponse|null) => {
        if (!lockIsAcquired){
            return;
        }
        // 延長処理
        (lock as LockType).extend().then(() => {
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

    const renderSteps = useCallback(() => {
        let steps: any = [];
        if (flow.flow.nodes) {
            steps = flow.flow.nodes.map((step: AllNodeType) => {
                let selected = (step.id === selectedStepIds[0]);
                const stepReadOnly = !(editMode === FlowEditModeValue.Editable) || serverConnectivity === Connectivity.Disconnected || readOnly ;
                return <Step
                    key={step.id}
                    step={step}
                    position={step.position}
                    selected={selected}
                    invalid={step.invalid}
                    error={step.error}
                    runnables={runnablesReader()}
                    flowData={flow.flow}
                    graphState={[graph, setGraph]}
                    selectedStepIds={selectedStepIds}
                    zoom={zoom}
                    dragRange={dragRange}
                    addSelectStep={addSelectStep}
                    deleteSelectStep={deleteSelectStep}
                    selectSteps={selectSteps}
                    selectFrame={frame => setSelectedFrame(frame)}
                    addHistory={addHistory}
                    readOnly={stepReadOnly}
                />;
            });
        }
        return steps;
    }, [ //nodes,
        selectedStepIds,
        flow,
        zoom,
        dragRange,
        addSelectStep,
        deleteSelectStep,
        selectSteps]);

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
        editMode === FlowEditModeValue.ReadOnlyUpdateDisabled) || serverConnectivity === Connectivity.Disconnected || readOnly

    // 編集可能で実行可能な場合のみフロー以外は disabled にする
    // ▶︎このフローを実行の制御
    const runDisabled = !(executeMode === FlowExecuteModeValue.Executable && editMode === FlowEditModeValue.Editable) || serverConnectivity === Connectivity.Disconnected || readOnly

    // 実行可能で編集可能orUpdate可能以外の場合は、プレビュー機能を disabled にする
    // プレビューを開くリンクの制御
    const previewDisabled = !(executeMode === FlowExecuteModeValue.Executable && editMode === FlowEditModeValue.Editable) || serverConnectivity === Connectivity.Disconnected || readOnly

    // 編集モード以外は、フロー変数の追加機能を hidden にする
    const addFlowVariableHidden = !(editMode === FlowEditModeValue.Editable) || serverConnectivity === Connectivity.Disconnected || readOnly

    // 編集モード以外は、コマンドセレクター機能を hidden にする
    const commandSelectorHidden = !(editMode === FlowEditModeValue.Editable) || serverConnectivity === Connectivity.Disconnected || readOnly

    // 編集モード以外は、コマンド・データのペイン機能を disabled にする
    const baseInspectorDisabled = !(editMode === FlowEditModeValue.Editable) || serverConnectivity === Connectivity.Disconnected || readOnly

    const onClickRunFlowPromise = () => {
        return onClickSaveFlow();
    }

    // ロックのUUID(ロックの取得に失敗した場合はundefined)
    const lockUUID = (!lockIsAcquired)? undefined: lock.uuid;

    return <div className={style.flow_editor_container}>
        <div className={style.flow_editor}>
            {/* <PaperZoom /> */}
            <ToolBar
                zoomState={[zoom, setZoom]}
                lockUUID={lockUUID}
                flowState={[flow, setFlow]}
                graphState={[graph, setGraph]}
                flowData={flow.flow}
                undoStackLength={undoStack.length}
                redoStackLength={redoStack.length}
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
                message={'フローを構築中です'} />
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
                runnables={runnablesReader()}
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
                // updateNodeEdges={updateNodeEdges}
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
