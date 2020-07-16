import React, {Fragment, useEffect, useRef, useState} from "react";
import Constants from "Constants/index";
import {APIUtil, ErrorUtil, GraphUtil, ModalUtil, ReactDomUtil, SortUtil, StateUtil, StringUtil} from "Utils/index";
import {BaseInspector} from "Shared/Inspector";
import style from "../style.scss";
import {Button, DownloadButton} from "Shared/Input";
import {DataFrameStepModel, FlowModel, FlowModelProps} from "Model/index";
import {CommandSelector} from "FlowEditorContainer/Command";
import {DataFrameDetailType, MastType} from "Types/index";
import {Loader} from "Shared/Base";
import {API} from "Modules/api";

type Props = {
    notify: Function;
    dismissNotify: Function;
    selected_data_source_detail: DataFrameDetailType;
    mast: MastType;
    loadFlowJSON: Function;
    deleteSteps: Function;
    selectSteps: Function;
    addHistory: Function;
    flow: FlowModelProps;
    selected_step_ids: string[];
    deleteCache: Function;
    nodes: [];
    addStep: Function;
    updateStep: Function;
    updateFlow: Function;
    readOnly: boolean;
    lockUUID: string | undefined;
    updateDataFrameDetail: Function;
}

const DataSourceInspector = (props: Props) => {

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
        },
        []);

    const saveFlow = () => {
        const {flow, lockUUID, notify, dismissNotify} = props;
        let saveNotify = notify({
            title: "フロー保存中",
            message: "フローの設定を保存しています",
            status: "loading",
            dismissAfter: 0
        });

        return new Promise(async (reslove, reject) => {

            await API.request.doPut.flow(
                {
                    flowUUID: inject_flow_uuid,
                    flow: flow,
                    lockUUID: lockUUID
                }
            )
                .then((response) => {
                    dismissNotify(saveNotify.id);
                    if (response.data.success === true) {
                        reslove(response.data);
                    } else {
                        reject(response.data);
                    }
                });
        })
        // 保存失敗した場合、エラーメッセージ出力
            .catch(e => {
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
        setLoading(true);
        setShowPreview(true);
    };

    useEffect(() => {
        if (showPreview) {
            const {mast} = props;
            let visualizers = mast.visualizers;
            const flow_uuid = inject_flow_uuid;
            const selected_step = getSelectedStep();
            let id = selected_step.id;
            let stepIds: (string | null | undefined)[] = [];
            stepIds.push(id);

            visualizers = SortUtil.getSortedContents(visualizers);

            saveFlow()
                .then((result: any) => {
                    if (result.success === true) {
                        // preview
                        let contents: any[] = [];
                        for (const v of visualizers) {
                            let content = {
                                flow_uuid: flow_uuid,
                                stepIds: stepIds,
                                frame_uuid: selected_step.uuid,
                                visualize: v
                            };
                            contents.push({title: v.label, content: content, id: id});
                        }
                        if (selected_step.uuid) {
                            // uuidだけでプレビュー
                            window.open("/preview?step_id=" + id + "&dialog=true&frame_uuid=" + selected_step.uuid + "&title=" + StringUtil.urlEncode(selected_step.label));
                        } else {
                            // 新規生成するので、step_id と flow_uuid と step_ids でデータを生成する
                            window.open("/preview?step_id=" + id + "&dialog=true&step_ids=" + StringUtil.urlEncode(JSON.stringify(stepIds)) + "&flow_uuid=" + flow_uuid + "&title=" + StringUtil.urlEncode(selected_step.label));
                        }
                    }
                })
                .catch((message) => {
                    console.log(message);
                })
                .then(() => {
                    setLoading(false);
                    updateCache();
                }).finally(() => {
                    setShowPreview(false);
                }
            );
        }
    }, [showPreview]);

    const updateCache = () => {
        const {notify, loadFlowJSON} = props;

        APIUtil.get("flows/" + inject_flow_uuid + "?navigation=off")
            .then((response) => {
                console.log(response);
                if (response.data.success === false) throw response.data;
                const json = response.data;
                loadFlowJSON(json);
            })
            .catch((error) => {
                console.log(error);
                notify({
                    title: "フロ取得エラー",
                    message: error.message + "(フローの読み込みに失敗しました。再読み込みしてください)",
                    status: "error",
                    dismissAfter: 0,
                    closeButton: true
                });
            });
    };

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
        let {flow}: any = props;
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
            flow.setInPort(port);
        } else {
            flow.deleteInPortWithId(selected_step.id);
        }

        if (flowOutChecked) {
            flow.setOutPort(port);
        } else {
            flow.deleteOutPortWithId(selected_step.id);
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
                if (selected_step.hasData()) {
                    //TODO 将来的にはページングなどの対応が必要
                    APIUtil.get("frames/" + selected_step.uuid + "?no_contents=1").then((response) => {
                        const json = response.data;
                        updateDataFrameDetail(json.data);
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

    const {mast, addStep, selectSteps, selected_step_ids, addHistory, selected_data_source_detail, readOnly} = props;
    let preview;
    let download;
    const selected_step = getSelectedStep();
    if (selected_step instanceof DataFrameStepModel) {
        preview = <Button onClick={() => onClickPreview()}
                          icon={"visibility"} disabled={(readOnly)}>プレビュー</Button>;
        if (selected_step.hasData()) {
            const href = APIUtil.apiUrl("files") + "?type=frame&uuid=" + selected_step.uuid + "&ext=csv&label=" + selected_step.label;
            download = <DownloadButton href={href} icon={"get_app"}>CSVダウンロード</DownloadButton>;
        }
    }

    const {flow} = props;
    const flowInOutForm = <div className={style.flowInOut}>
        <div>
            <label><input type="checkbox" checked={flow.hasInPortWithId(selected_step.id || "")} ref={flowIn}
                          onChange={() => onChangeFlowInOut()} disabled={readOnly} />
                &nbsp;入力
            </label>
        </div>
        <div>
            <label><input type="checkbox" checked={flow.hasOutPortWithId(selected_step.id || "")}
                          ref={flowOut}
                          onChange={() => onChangeFlowInOut()} disabled={readOnly} />
                &nbsp;出力
            </label>
        </div>
    </div>;
    const cacheCheckForm = <div>
        <div>
            <label><input type="checkbox" checked={(selected_step.makeCache)}
                          ref={cache} disabled={readOnly}
                          onChange={() => onChangeCacheCheck()} />
            </label>
        </div>
    </div>;

    let content;

    if (loading) {
        content = <Loader center={true} absolute={true} fixed={false} visible={true} />;
    } else {


        let fileSize = selected_data_source_detail && selected_data_source_detail.fileSize ? selected_data_source_detail.fileSize : 0;
        fileSize = StringUtil.convertToFileSize(fileSize);
        let lastModifiedAt = selected_data_source_detail ? selected_data_source_detail.lastModifiedAt : "";
        let lastModifier = selected_data_source_detail ? selected_data_source_detail.lastModifier : "";

        content = <div>
            <div className={style.property_overview}>
                <div className={style.actions}>
                    {preview}
                    {download}
                    <Button onClick={() => onClickDelete()} icon={"delete"}
                            danger={true} disabled={readOnly}>削除</Button>
                </div>
                <div className={style.full_hr} />
                <div className={style.overviews}>
                    <div className={style.overview}>
                        <div className={style.overview_label}>
                            ファイルサイズ
                        </div>
                        <div className={style.overview_value}>
                            {fileSize}
                        </div>
                    </div>
                    {renderFrameDetail(selected_data_source_detail)}
                    <div className={style.overview}>
                        <div className={style.overview_label}>
                            作成日時
                        </div>
                        <div className={style.overview_value}>
                            {lastModifiedAt} {/*{property.overview.created_at || ""}*/}
                        </div>
                    </div>
                    <div className={style.overview}>
                        <div className={style.overview_label}>
                            作成者
                        </div>
                        <div className={style.overview_value}>
                            {lastModifier}{/*{property.overview.created_user_name || ""}*/}
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
                            disabled={(!selected_step.isCached() || readOnly)}
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
                (!readOnly) ?
                    <Fragment>
                        <div className={style.full_hr} />
                        <CommandSelector
                            mast={mast}
                            numberOfInput={1}
                            selected_step_ids={selected_step_ids}
                            addStep={addStep}
                            selectSteps={selectSteps}
                            addHistory={addHistory}
                        />
                    </Fragment>
                    : null
            }
        </div>;
    }

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector header={""} label={selected_step.label}
                          onBlurTitle={(e) => onBlurTitle(e)} onHide={() => {
    }} disabled={readOnly}>
        {content}
    </BaseInspector>;
};


export {DataSourceInspector};
