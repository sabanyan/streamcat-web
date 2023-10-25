import React, {Fragment, useEffect, useRef, useState} from "react";
import Constants from "Constants/index";
import { Api } from 'Api';
import {FlowUtil, ModalUtil, StateUtil, StringUtil} from "Utils/index";
import {BaseInspector} from "Shared/Inspector";
import style from "../style.scss";
import {Button, DownloadButton} from "Shared/Input";
import {CommandSelector} from "FlowEditorContainer/Command";
import {RunnablesType} from "Types/index";
import {Loader} from "Shared/Base";
import { AllNodeType, Command, Flow, FlowCommand, FlowType, InlineFlowCommand, Port } from "Model/Library";
import { useStreamCatNotifications } from "Shared/Notification";
import { FrameNodeType } from "Model/Node/NodeTypes";
import { useAsyncResource } from "use-async-resource";

type Props = {
    // selected_data_source_detail: FrameType;
    runnables: RunnablesType;
    deleteNodes: (nodes: AllNodeType[]) => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    addHistory: () => void;
    flowData: Flow;
    // Flowの更新に用いる
    lastSavedFlow?: FlowType;
    selectedNodes: AllNodeType[];
    // selectedFrameState: [FrameType|undefined, (value:React.SetStateAction<FrameType|undefined>)=>void];
    deleteCache: Function;
    // nodes: AllNodeType[];
    zoom: number;
    addNode: (addNode:AllNodeType, srcNodes:AllNodeType[], dstNodes:AllNodeType[], zoom:number) => void;
    addDataSrcNode: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstNode: (command:Command | FlowCommand | InlineFlowCommand, selectedNodeId:string) => void;
    updateNode: (node: AllNodeType) => void;
    updateFlow: (flowData:Flow, zoom:number) => void;
    updateLastSavedFlow: (lastSavedFlow:FlowType) => void;
    previewDisabled: boolean;
    baseInspectorDisabled: boolean;
    commandSelectorHidden: boolean;
    lockUUID: string | undefined;
    // updateDataFrameDetail: Function;
    // refreshFlow: (context: FlowType) => void;
}

type Content = {
    flowUuid: string;
    nodeIds: (string | null | undefined)[];
    frameUuid: string | null;
    lockUuid?: string;
    visualize: any;
}

type Contents = {
    title: string;
    content: Content;
    id: string | null | undefined;
    afterViz: Function;
}

const getFrame = (frameUuid?:string|null) => {
    if(frameUuid){
        return Api.findFrame(frameUuid);
    }else{
        return Api.findNull();
    }
};

const DataFrameInspector = (props: Props) => {

    const {notifyLoading, notifyError, dismissNotify} = useStreamCatNotifications();

    const flowIn = useRef<HTMLInputElement>(null);
    const flowOut = useRef<HTMLInputElement>(null);
    const cache = useRef<HTMLInputElement>(null);
    // const [dataFrameDetail,setDataFrameDetail] = useState<DataFrameDetailType>(undefined);
    const [loading, setLoading] = useState<boolean>(false);

    const [showPreview, setShowPreview] = useState<boolean>(false);

    useEffect(() => {
        //モーダル処理の登録
        ModalUtil.registerModal({
            id: Constants.modal.PREVIEW_DATASOURCE, onClickOK: () => {
                ModalUtil.closeModal(Constants.modal.PREVIEW_DATASOURCE);
            }
        });
    }, []);

    const getSelectedNode = () => {
        // let {selectedNodes, flowData} = props;
        // return FlowUtil.getNode(flowData.nodes, selectedNodes[0]) as FrameNodeType;
        const {selectedNodes} = props;
        return selectedNodes[0] as FrameNodeType;
    };

    // ここでFrameの取得を開始する
    const selectedNode = getSelectedNode();
    const [flowReader] = useAsyncResource(getFrame, selectedNode.uuid);

    const saveFlow = () => {
        const {flowData, lastSavedFlow, lockUUID, updateLastSavedFlow} = props;
        const notificationId = notifyLoading('フロー保存中', 'フローの設定を保存しています');

        return lastSavedFlow && lastSavedFlow.update(flowData, lockUUID).then(result => {
            dismissNotify(notificationId);
            // FIXME: PUT /flow の戻り値にflow属性が含まれていない、そのためflow属性の値は複製して格納する
            updateLastSavedFlow({...result, flow:flowData.clone()});
        }).catch(e => {
            // 保存失敗した場合、エラーメッセージ出力
            notifyError('フロー保存エラー', e.message);
        });
    };

    const onClickPreview = () => {
        setShowPreview(true);
    }
    
    useEffect(() => {
        if(!showPreview) return;
        
        const {lockUUID} = props;
        const flowUuid = inject_flow_uuid;
        const selectedNode = getSelectedNode();
        const id = selectedNode.id;
        const nodeIds: (string | null | undefined)[] = [];
        nodeIds.push(id);

        saveFlow()?.then(() => {
            // preview
            if (selectedNode.uuid) {
                // uuidだけでプレビュー
                window.open("/preview?node_id=" + id +
                            "&dialog=true" +
                            "&title=" + StringUtil.urlEncode(selectedNode.label || '') +
                            "&frame_uuid=" + selectedNode.uuid);
            } else {
                // 新規生成するので、step_id と flowUuid と step_ids でデータを生成する
                window.open("/preview?node_id=" + id +
                            "&dialog=true" +
                            "&title=" + StringUtil.urlEncode(selectedNode.label || '') +
                            "&flow_uuid=" + flowUuid +
                            "&lock_uuid=" + lockUUID +
                            "&node_ids=" + StringUtil.urlEncode(JSON.stringify(nodeIds)));
            }
        }).catch((message) => {
            console.log(message);
        }).then(() => {
            setLoading(false);
        }).finally(() => {
            setShowPreview(false);
        });
    }, [showPreview]);

    const onClickDelete = () => {
        const {deleteNodes, selectNodes, addHistory} = props;
        let {selectedNodes, flowData} = props;
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const selectedNode = selectedNodes[0];
                deleteNodes([selectedNode]);
                selectNodes([]);
                addHistory();
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "削除する",
            danger: true,
            content: <div>
                選択されたデータソースを削除しますか？
            </div>
        });
    };


    const onChangeFlowInOut = () => {
        const {flowData, updateFlow} = props;
        const flowInChecked = (flowIn && flowIn.current) ? flowIn.current.checked : false;
        const flowOutChecked = (flowOut && flowOut.current) ? flowOut.current.checked : false;

        const selectedNode = getSelectedNode();
        //パラメーターを更新
        const port = {
            // TODO: Portのlabelは一意である必要があるので、getLabel() -> idに変更した
            // label: selected_step.getLabel(),
            label: selectedNode.id,
            nodeId: selectedNode.id,
            type: selectedNode.type
        };

        if (flowInChecked) {
            if(!port.label || !port.nodeId || !port.type) {
                throw new Error("port is not set");
            }
            flowData.ports[0].upsert(port as Port);
        } else {
            selectedNode.id && flowData.ports[0].removeByNodeId(selectedNode.id);
        }

        if (flowOutChecked) {
            if(!port.label || !port.nodeId || !port.type) {
                throw new Error("port is not set");
            }
            flowData.ports[1].upsert(port as Port);
        } else {
            selectedNode.id && flowData.ports[1].removeByNodeId(selectedNode.id);
        }

        updateFlow(flowData, zoom);
    };

    const onChangeCacheCheck = () => {
        const {updateNode} = props;
        const selectedNode = getSelectedNode();
        if (selectedNode.makeCache) {
            selectedNode.makeCache = false;
        } else {
            selectedNode.makeCache = true;
        }
        updateNode(selectedNode);
    };

    const onClickDeleteCache = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                deleteCache();
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });

        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "削除する",
            danger: true,
            content: <div>
                選択されたデータソースのキャッシュを削除しますか？
            </div>
        });
    };

    const deleteCache = () => {
        const {lastSavedFlow, selectedNodes, deleteCache} = props;
        // const [, setSelectedFrame] = props.selectedFrameState;
        const id = selectedNodes[0].id;

        // キャッシュファイルを削除する
        lastSavedFlow && lastSavedFlow.deleteCache(id).then(() => {
            // NodeのuuidとcacheCreatedAtプロパティをクリアする
            deleteCache(id);
        }).catch(e => {
            // NOTE: キャッシュが他のNodeからも参照されている場合にAPIはエラーを返すが
            // その場合でもNodeのプロパティをクリアしてキャッシュとの紐付けを解除する
            deleteCache(id);
        });
    };

    const renderFrameDetail = (data_source_detail) => {
        let result: React.ReactNode = null;
        if (data_source_detail && data_source_detail.encoding && data_source_detail.newline) {
            result = <React.Fragment>
                <div className={style.overview}>
                    <div className={style.overview_label}>
                        文字コード
                    </div>
                    <div className={style.overview_value}>
                        {data_source_detail.encoding}
                    </div>
                </div>
                <div className={style.overview}>
                    <div className={style.overview_label}>
                        改行コード
                    </div>
                    <div className={style.overview_value}>
                        {data_source_detail.newline}
                    </div>
                </div>
            </React.Fragment>;
        }

        return result;
    };

    const onBlurTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {updateNode} = props;
        const selectedNode = getSelectedNode();
        selectedNode.label = e.target.value;
        updateNode(selectedNode);
    };

    const { runnables, zoom, addNode, addDataSrcNode, addDataDstNode, selectNodes, selectedNodes, addHistory,
            previewDisabled, baseInspectorDisabled, commandSelectorHidden} = props;
    let preview;
    let download;
    if (selectedNode.type === 'frame') {
        preview = <Button onClick={() => onClickPreview()}
            icon={"visibility"} disabled={previewDisabled}>プレビュー</Button>;
        if (selectedNode.hasData()) {
            const onClick = () => Api.downloadFrame(selectedNode.uuid!, selectedNode.label || selectedNode.id);
            download = <DownloadButton onClick={onClick} download={true} disabled={baseInspectorDisabled} icon={"get_app"}>CSVダウンロード</DownloadButton>;
        }
    }

    const {flowData} = props;
    const flowInOutForm = <div className={style.flowInOut}>
        <div>
            <label><input type="checkbox" checked={!!selectedNode.id && flowData.ports[0].exists(selectedNode.id)} ref={flowIn}
                onChange={() => onChangeFlowInOut()} disabled={baseInspectorDisabled} />
                &nbsp;入力
            </label>
        </div>
        <div>
            <label><input type="checkbox" checked={!!selectedNode.id && flowData.ports[1].exists(selectedNode.id)}
                ref={flowOut}
                onChange={() => onChangeFlowInOut()} disabled={baseInspectorDisabled} />
                &nbsp;出力
            </label>
        </div>
    </div>;
    const cacheCheckForm = <div>
        <div>
            <label><input type="checkbox" checked={(selectedNode.makeCache)}
                ref={cache} disabled={baseInspectorDisabled}
                onChange={() => onChangeCacheCheck()} />
            </label>
        </div>
    </div>;

    let content;

    if (loading) {
        content = <Loader center={true} absolute={true} fixed={false} visible={true} />;
    } else {
        // Frameを取得する
        const selectedFrame = flowReader();

        const fileSize = selectedFrame && selectedFrame.fileSize ? selectedFrame.fileSize : 0;
        const fileSizeStr = StringUtil.convertToFileSize(fileSize);
        const createdAt = selectedFrame ? selectedFrame.createdAt : "";
        const creator = selectedFrame ? selectedFrame.creator : "";

        content = <div>
            <div className={style.property_overview}>
                <div className={style.actions}>
                    {preview}
                    {download}
                    <Button onClick={() => onClickDelete()} icon={"delete"}
                        danger={true} disabled={baseInspectorDisabled}>削除</Button>
                </div>
                <div className={style.full_hr} />
                <div className={style.overviews}>
                    <div className={style.overview}>
                        <div className={style.overview_label}>
                            ファイルサイズ
                        </div>
                        <div className={style.overview_value}>
                            {fileSizeStr}
                        </div>
                    </div>
                    {renderFrameDetail(selectedFrame)}
                    <div className={style.overview}>
                        <div className={style.overview_label}>
                            作成日時
                        </div>
                        <div className={style.overview_value}>
                            {createdAt} {/*{property.overview.created_at || ""}*/}
                        </div>
                    </div>
                    <div className={style.overview}>
                        <div className={style.overview_label}>
                            作成者
                        </div>
                        <div className={style.overview_value}>
                            {creator}{/*{property.overview.created_user_name || ""}*/}
                        </div>
                    </div>
                    <div className={style.overview}>
                        <div className={style.overview_label}>
                            フロー入出力
                        </div>
                        <div className={style.overview_value}>
                            {flowInOutForm}
                        </div>
                    </div>
                </div>
            </div>
            <div className={style.cache}>
                <div className={style.cache_label}>
                    結果をキャッシュ
                </div>
                <div className={style.cache_value}>
                    {cacheCheckForm}
                </div>
                <div className={style.cache_delete}>
                    <Button icon={"delete"} danger={true}
                        disabled={(!selectedNode.isCached() || baseInspectorDisabled)}
                        onClick={() => {
                            onClickDeleteCache();
                        }}>
                        キャッシュ削除
                    </Button>
                </div>
                {
                    /*
                    <div className={style.cache_label}>
                    キャッシュ作成日
                    </div>
                    <div className={style.cache_value}>
                      {selected_step.cacheCreatedAt}
                    </div>
                    */
                }

            </div>
            {
                (!commandSelectorHidden) ?
                    <Fragment>
                        <div className={style.full_hr} />
                        <CommandSelector
                            nodes={flowData.nodes}
                            runnables={runnables}
                            numberOfInput={1}
                            selectedNodes={selectedNodes}
                            zoom={zoom}
                            addNode={addNode}
                            addDataSrcNode={addDataSrcNode}
                            addDataDstNode={addDataDstNode}
                            selectNodes={selectNodes}
                            addHistory={addHistory}
                        />
                    </Fragment>
                    : null
            }
        </div>;
    }

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector key={selectedNode.uuid} header={''} label={selectedNode.label || ''}
        onBlurTitle={(e) => onBlurTitle(e)} onHide={() => {
        }} disabled={baseInspectorDisabled}>
        {content}
    </BaseInspector>;
};


export {DataFrameInspector, Contents};
