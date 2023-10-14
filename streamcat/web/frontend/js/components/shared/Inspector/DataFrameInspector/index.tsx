import React, {Fragment, useEffect, useRef, useState} from "react";
import Constants from "Constants/index";
import { Api } from 'Api';
import {GraphUtil, ModalUtil, SortUtil, StateUtil, StringUtil} from "Utils/index";
import {BaseInspector} from "Shared/Inspector";
import style from "../style.scss";
import {Button, DownloadButton} from "Shared/Input";
import {CommandSelector} from "FlowEditorContainer/Command";
import {RunnablesType} from "Types/index";
import {Loader} from "Shared/Base";
import { AllNodeType, Command, Flow, FlowCommand, FlowType, FrameType, InlineFlowCommand, Port } from "Model/Library";
import { useStreamCatNotifications } from "Shared/Notification";
import { FrameNodeType } from "Model/Node/NodeTypes";

type Props = {
    // selected_data_source_detail: FrameType;
    runnables: RunnablesType;
    deleteSteps: (step_ids: string[]) => void;
    selectSteps: (selected_steps: AllNodeType[]) => void;
    addHistory: () => void;
    flowData: Flow;
    // Flowの更新に用いる
    lastSavedFlow?: FlowType;
    selectedStepIds: string[];
    selectedFrameState: [FrameType|undefined, (value:React.SetStateAction<FrameType|undefined>)=>void];
    deleteCache: Function;
    // nodes: AllNodeType[];
    zoom: number;
    addStep: (add_step:AllNodeType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => void;
    addDataSrcStep: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstStep: (command:Command | FlowCommand | InlineFlowCommand, selectedStepId:string) => void;
    updateStep: (step: AllNodeType) => void;
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
    stepIds: (string | null | undefined)[];
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

    const saveFlow = () => {
        const {flowData, lastSavedFlow, lockUUID, updateLastSavedFlow} = props;
        const notificationId = notifyLoading('フロー保存中', 'フローの設定を保存しています');

        return lastSavedFlow && lastSavedFlow.update(flowData, lockUUID).then(result => {
            dismissNotify(notificationId);
            // FIXME: PUT /flow の戻り値にflow属性が含まれていない
            updateLastSavedFlow({...result, flow:flowData});
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
        const selected_step = getSelectedStep();
        let id = selected_step.id;
        let stepIds: (string | null | undefined)[] = [];
        stepIds.push(id);

        saveFlow()?.then(() => {
            // preview
            if (selected_step.uuid) {
                // uuidだけでプレビュー
                window.open("/preview?step_id=" + id +
                            "&dialog=true" +
                            "&title=" + StringUtil.urlEncode(selected_step.label || '') +
                            "&frame_uuid=" + selected_step.uuid);
            } else {
                // 新規生成するので、step_id と flowUuid と step_ids でデータを生成する
                window.open("/preview?step_id=" + id +
                            "&dialog=true" +
                            "&title=" + StringUtil.urlEncode(selected_step.label || '') +
                            "&flow_uuid=" + flowUuid +
                            "&lock_uuid=" + lockUUID +
                            "&step_ids=" + StringUtil.urlEncode(JSON.stringify(stepIds)));
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
        const {deleteSteps, selectSteps, addHistory} = props;
        let {selectedStepIds, flowData} = props;
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const selected_step = GraphUtil.getNode(flowData.nodes, selectedStepIds[0]);
                deleteSteps([selected_step.id]);
                selectSteps([]);
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
        const {updateFlow} = props;
        let {flowData} = props;
        const flowInChecked = (flowIn && flowIn.current) ? flowIn.current.checked : false;
        const flowOutChecked = (flowOut && flowOut.current) ? flowOut.current.checked : false;

        let selected_step = getSelectedStep();
        //パラメーターを更新
        const port = {
            // TODO: Portのlabelは一意である必要があるので、getLabel() -> idに変更した
            // label: selected_step.getLabel(),
            label: selected_step.id,
            nodeId: selected_step.id,
            type: selected_step.type
        };

        if (flowInChecked) {
            if(!port.label || !port.nodeId || !port.type) {
                throw new Error("port is not set");
            }
            flowData.ports[0].upsert(port as Port);
        } else {
            selected_step.id && flowData.ports[0].removeByNodeId(selected_step.id);
        }

        if (flowOutChecked) {
            if(!port.label || !port.nodeId || !port.type) {
                throw new Error("port is not set");
            }
            flowData.ports[1].upsert(port as Port);
        } else {
            selected_step.id && flowData.ports[1].removeByNodeId(selected_step.id);
        }

        updateFlow(flowData, zoom);
    };


    const getSelectedStep = () => {
        let {selectedStepIds, flowData} = props;
        return GraphUtil.getNode(flowData.nodes, selectedStepIds[0]) as FrameNodeType;
    };

    const onChangeCacheCheck = () => {
        const {updateFlow, flowData} = props;
        let selected_step = getSelectedStep();
        if (selected_step.makeCache) {
            selected_step.makeCache = false;
        } else {
            selected_step.makeCache = true;
        }
        updateFlow(flowData, zoom);
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
        const {lastSavedFlow, selectedStepIds, deleteCache} = props;
        const [, setSelectedFrame] = props.selectedFrameState;
        const id = selectedStepIds[0];

        // キャッシュを削除する
        lastSavedFlow && lastSavedFlow.deleteCache(id).then(() => {
            deleteCache(id);
            setSelectedFrame(undefined);
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
        const {updateStep} = props;
        const selectedStep = getSelectedStep();
        let newSelectedStep = StateUtil.deepCopy(selectedStep);
        newSelectedStep.label = e.target.value;
        updateStep(newSelectedStep);
    };

    const { runnables, zoom, addStep, addDataSrcStep, addDataDstStep, selectSteps, selectedStepIds, addHistory,
            previewDisabled, baseInspectorDisabled, commandSelectorHidden} = props;
    let preview;
    let download;
    const selected_step = getSelectedStep();
    if (selected_step.type === 'frame') {
        preview = <Button onClick={() => onClickPreview()}
            icon={"visibility"} disabled={previewDisabled}>プレビュー</Button>;
        if (selected_step.hasData()) {
            const onClick = () => Api.downloadFrame(selected_step.uuid!, selected_step.label || selected_step.id);
            download = <DownloadButton onClick={onClick} download={true} disabled={baseInspectorDisabled} icon={"get_app"}>CSVダウンロード</DownloadButton>;
        }
    }

    const {flowData} = props;
    const flowInOutForm = <div className={style.flowInOut}>
        <div>
            <label><input type="checkbox" checked={!!selected_step.id && flowData.ports[0].exists(selected_step.id)} ref={flowIn}
                onChange={() => onChangeFlowInOut()} disabled={baseInspectorDisabled} />
                &nbsp;入力
            </label>
        </div>
        <div>
            <label><input type="checkbox" checked={!!selected_step.id && flowData.ports[1].exists(selected_step.id)}
                ref={flowOut}
                onChange={() => onChangeFlowInOut()} disabled={baseInspectorDisabled} />
                &nbsp;出力
            </label>
        </div>
    </div>;
    const cacheCheckForm = <div>
        <div>
            <label><input type="checkbox" checked={(selected_step.makeCache)}
                ref={cache} disabled={baseInspectorDisabled}
                onChange={() => onChangeCacheCheck()} />
            </label>
        </div>
    </div>;

    let content;

    if (loading) {
        content = <Loader center={true} absolute={true} fixed={false} visible={true} />;
    } else {

        const [selectedFrame, ] = props.selectedFrameState;

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
                        disabled={(!selected_step.isCached() || baseInspectorDisabled)}
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
                            selectedStepIds={selectedStepIds}
                            zoom={zoom}
                            addStep={addStep}
                            addDataSrcStep={addDataSrcStep}
                            addDataDstStep={addDataDstStep}
                            selectSteps={selectSteps}
                            addHistory={addHistory}
                        />
                    </Fragment>
                    : null
            }
        </div>;
    }

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector key={selected_step.uuid} header={''} label={selected_step.label || ''}
        onBlurTitle={(e) => onBlurTitle(e)} onHide={() => {
        }} disabled={baseInspectorDisabled}>
        {content}
    </BaseInspector>;
};


export {DataFrameInspector, Contents};
