import React, {Fragment, useEffect, useRef, useState} from "react";
import Constants from "Constants/index";
import {APIUtil, APIUtil2, ErrorUtil, GraphUtil, ModalUtil, ReactDomUtil, SortUtil, StateUtil, StringUtil} from "Utils/index";
import {BaseInspector} from "Shared/Inspector";
import style from "../style.scss";
import {Button, DownloadButton} from "Shared/Input";
import {DataFrameStepModel} from "Model/index";
import {CommandSelector} from "FlowEditorContainer/Command";
import {DataFrameDetailType, MastType} from "Types/index";
import {Loader} from "Shared/Base";
import { FlowType, Port } from "Model/Library";

type Props = {
    notify: Function;
    dismissNotify: Function;
    selected_data_source_detail: DataFrameDetailType;
    mast: MastType;
    deleteSteps: Function;
    selectSteps: Function;
    addHistory: Function;
    flow: FlowType;
    selected_step_ids: string[];
    deleteCache: Function;
    nodes: any[];
    addStep: Function;
    addDataSrcStep: Function;
    addDataDstStep: Function;
    updateStep: Function;
    updateFlow: Function;
    updateLastSavedFlow: Function;
    previewDisabled: boolean;
    baseInspectorDisabled: boolean;
    commandSelectorHidden: boolean;
    lockUUID: string | undefined;
    updateDataFrameDetail: Function;
    refreshFlow: Function;
}

type Content = {
    flow_uuid: string;
    stepIds: (string | null | undefined)[];
    frame_uuid: string | null;
    lock_uuid?: string;
    visualize: any;
}

type Contents = {
    title: string;
    content: Content;
    id: string | null | undefined;
    afterViz: Function;
}

const DataFrameInspector = (props: Props) => {

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
        const {flow, lockUUID, notify, dismissNotify, updateLastSavedFlow} = props;
        let saveNotify = notify({
            title: "フロー保存中",
            message: "フローの設定を保存しています",
            status: "loading",
            dismissAfter: 0
        });

        return flow.update(flow.flow, lockUUID).then(flow => {
            dismissNotify(saveNotify.id);
            updateLastSavedFlow();
        }).catch(e => {
            // 保存失敗した場合、エラーメッセージ出力
            notify({
                title: "フロー保存エラー",
                message: e.message,
                status: "error",
                dismissAfter: -1,
                closeButton: true
            });
        });
    };

    const onClickPreview = () => {
        setShowPreview(true);
    }
    
    useEffect(() => {
        if(!showPreview) return;
        
        const {mast, lockUUID} = props;
        let visualizers = mast.visualizers;
        const flow_uuid = inject_flow_uuid;
        const selected_step = getSelectedStep();
        let id = selected_step.id;
        let stepIds: (string | null | undefined)[] = [];
        stepIds.push(id);

        visualizers = SortUtil.getSortedContents(visualizers);

        saveFlow().then(() => {
            // preview
            if (selected_step.uuid) {
                // uuidだけでプレビュー
                window.open("/preview?step_id=" + id +
                            "&dialog=true" +
                            "&title=" + StringUtil.urlEncode(selected_step.label) +
                            "&frame_uuid=" + selected_step.uuid);
            } else {
                // 新規生成するので、step_id と flow_uuid と step_ids でデータを生成する
                window.open("/preview?step_id=" + id +
                            "&dialog=true" +
                            "&title=" + StringUtil.urlEncode(selected_step.label) +
                            "&flow_uuid=" + flow_uuid +
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
        let {selected_step_ids, nodes} = props;
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const selected_step = GraphUtil.getNode(nodes, (selected_step_ids as any)[0]);
                deleteSteps([selected_step.id]);
                selectSteps();
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
        let {flow} = props;
        const flowInChecked = (flowIn && flowIn.current) ? flowIn.current.checked : false;
        const flowOutChecked = (flowOut && flowOut.current) ? flowOut.current.checked : false;

        let selected_step = getSelectedStep();
        //パラメーターを更新
        const port = {
            label: selected_step.getLabel(),
            nodeId: selected_step.id,
            type: selected_step.type
        };

        if (flowInChecked) {
            if(!port.label || !port.nodeId || !port.type) {
                throw new Error("port is not set");
            }
            flow.flow.ports[0].upsertPort(port as Port);
        } else {
            selected_step.id && flow.flow.ports[0].removePort(selected_step.id);
        }

        if (flowOutChecked) {
            if(!port.label || !port.nodeId || !port.type) {
                throw new Error("port is not set");
            }
            flow.flow.ports[1].upsertPort(port as Port);
        } else {
            selected_step.id && flow.flow.ports[1].removePort(selected_step.id);
        }

        updateFlow(flow);
    };


    const getSelectedStep = (): DataFrameStepModel => {
        let {selected_step_ids, nodes} = props;
        return GraphUtil.getNode(nodes, (selected_step_ids as any)[0]);
    };

    const onChangeCacheCheck = () => {
        const {updateFlow, flow} = props;
        let selected_step = getSelectedStep();
        if (selected_step.isMakeCache()) {
            selected_step.setMakeCache(false);
        } else {
            selected_step.setMakeCache(true);
        }
        updateFlow(flow);
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
        const {selected_step_ids, notify, deleteCache, updateDataFrameDetail} = props;
        const id = (selected_step_ids as any)[0];
        const url = "caches?of=" + inject_flow_uuid + "." + id;

        APIUtil.delete(url).then((response) => {
            if (!response.data.success) {
                notify({
                    title: "実行エラー",
                    message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
                    status: "error",
                    dismissAfter: 0,
                    closeButton: true
                });
            }
            if (response.data.success) {
                deleteCache(id);
                const selected_step = getSelectedStep();
                if (selected_step.hasData() && selected_step.uuid) {
                    //TODO 将来的にはページングなどの対応が必要
                    APIUtil2.findFrame(selected_step.uuid).then(frame => {
                        updateDataFrameDetail(frame);
                    });
                } else {
                    updateDataFrameDetail({});
                }
            }
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

    const { mast, addStep, addDataSrcStep, addDataDstStep, selectSteps, selected_step_ids, addHistory,
            selected_data_source_detail, previewDisabled, baseInspectorDisabled, commandSelectorHidden} = props;
    let preview;
    let download;
    const selected_step = getSelectedStep();
    if (selected_step instanceof DataFrameStepModel) {
        preview = <Button onClick={() => onClickPreview()}
            icon={"visibility"} disabled={previewDisabled}>プレビュー</Button>;
        if (selected_step.hasData()) {
            const href = APIUtil.apiUrl("files") + "?type=frame&uuid=" + selected_step.uuid + "&ext=csv&label=" + selected_step.label;
            download = <DownloadButton href={href} disabled={baseInspectorDisabled} icon={"get_app"}>CSVダウンロード</DownloadButton>;
        }
    }

    const {flow} = props;
    const flowInOutForm = <div className={style.flowInOut}>
        <div>
            <label><input type="checkbox" checked={!!selected_step.id && flow.flow.ports[0].hasPort(selected_step.id)} ref={flowIn}
                onChange={() => onChangeFlowInOut()} disabled={baseInspectorDisabled} />
                &nbsp;入力
            </label>
        </div>
        <div>
            <label><input type="checkbox" checked={!!selected_step.id && flow.flow.ports[1].hasPort(selected_step.id)}
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

        const fileSize = selected_data_source_detail && selected_data_source_detail.fileSize ? selected_data_source_detail.fileSize : 0;
        const fileSizeStr = StringUtil.convertToFileSize(fileSize);
        const createdAt = selected_data_source_detail ? selected_data_source_detail.createdAt : "";
        const creator = selected_data_source_detail ? selected_data_source_detail.creator : "";

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
                    {renderFrameDetail(selected_data_source_detail)}
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
                            nodes={[]}
                            mast={mast}
                            numberOfInput={1}
                            selected_step_ids={selected_step_ids}
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
