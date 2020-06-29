//@flow
import React, {useCallback, useEffect, useMemo, useReducer, useState} from "react";
import Paper from "FlowEditorContainer/Paper";
import PaperScroller from "FlowEditorContainer/PaperScroller";
import {Edge, Selector, Step} from "Shared/SVG";
import PaperZoom from "FlowEditorContainer/PaperZoom";
import ToolBar from "FlowEditorContainer/ToolBar/Core";
import Constants from "Constants/index";
import style from "./style.scss";
import {APIUtil, GraphUtil, ZoomUtil} from "Utils/index";
import CommandModel from "Model/Command/CommandModel";
import {Loader} from "Shared/Base";
import {DataFrameDetailType , StepModelType, SubFlowParamType} from "Types/index";
import {Inspector} from "Shared/Inspector";
import {DataFrameStepModel, SubflowCommandModel, VisualizeModel} from "Model/index";
import {NotificationManager} from "Shared/Notification";
import {API} from "Modules/api/index";
import {addNotification, removeNotification} from "reapop";
import FlowEditorReducer, {
    addHistoryAction,
    addMasterAction,
    addNoteAction,
    addSelectStepAction,
    addStepAction,
    copyStepsAction,
    cutStepsAction,
    deleteCacheAction,
    deleteSelectStepAction,
    deleteStepsAction,
    dragEndAction,
    draggingAction,
    dragStartAction,
    executeFlowAction,
    initialState,
    loadFlowJSONAction,
    moveStepsAction,
    pasteStepsAction,
    redoAction,
    resizeInspectorAction,
    selectStepsAction,
    selectTabAction,
    setZoomAction,
    sortFlowAction,
    sortStepSrcEndAction,
    undoAction,
    updateDataFrameDetailAction,
    updateFlowAction,
    updateStepAction
} from "Modules/application";

const FlowEditor = () => {

    const [state, dispatch] = useReducer(FlowEditorReducer, initialState);
    const flow = state.flow;
    const drag = state.drag;
    const selected_step_ids = state.selected_step_ids;
    const nodes = state.nodes;
    const history = state.history;
    const mast = state.mast;
    const selected_tab_id = state.selected_tab_id;
    const selected_data_source_detail = state.selected_data_source_detail;
    const graph = state.graph;
    const zoom = state.zoom;
    const inspector = state.inspector;
    const editor = state.editor;

    const loadFlowJSON = useCallback((context: {}) => {
        return dispatch(loadFlowJSONAction(context));
    },[]);
    const addMaster = useCallback((context: {}) => {
        dispatch(addMasterAction(context));
    },[]);
    const addStep = useCallback((add_step: StepModelType, src_step_ids: [] = [], dst_step_ids: [] = []) => {
        dispatch(addStepAction(add_step, src_step_ids, dst_step_ids));
    },[]);
    const updateStep = useCallback((step: StepModelType) => {
        dispatch(updateStepAction(step));
    },[]);
    const updateFlow = useCallback((flow) => {
        dispatch(updateFlowAction(flow));
    },[]);
    const selectSteps = useCallback((selected_steps: []) => {
        dispatch(selectStepsAction(selected_steps));
    },[]);
    const addSelectStep = useCallback((selected_step_id: string) => {
        dispatch(addSelectStepAction(selected_step_id));
    },[]);
    const deleteSelectStep = useCallback((selected_step_id: string) => {
        dispatch(deleteSelectStepAction(selected_step_id));
    },[]);
    const deleteSteps = useCallback((step_ids: []) => {
        dispatch(deleteStepsAction(step_ids));
    },[]);
    const deleteCache = useCallback((selected_step_id: string) => {
        dispatch(deleteCacheAction(selected_step_id));
    },[]);
    const cutSteps = useCallback((step_ids: []) => {
        dispatch(cutStepsAction(step_ids));
    },[]);
    const copySteps = useCallback((step_ids: []) => {
        dispatch(copyStepsAction(step_ids));
    },[]);
    const pasteSteps = useCallback((paste_nodes: []) => {
        dispatch(pasteStepsAction(paste_nodes));
    },[]);
    const addHistory = useCallback(() => {
        dispatch(addHistoryAction());
    },[]);
    const undo = useCallback(() => {
        dispatch(undoAction());
    },[]);
    const redo = useCallback(() => {
        dispatch(redoAction());
    },[]);
    const sortFlow = useCallback(() => {
        dispatch(sortFlowAction());
    },[]);
    const executeFlow = useCallback((flowid: string) => {
        // flowidは未使用
        dispatch(executeFlowAction(flowid));
    },[]);
    const selectTab = useCallback((tab_id: string) => {
        dispatch(selectTabAction(tab_id));
    },[]);
    const dragStart = useCallback((x: number, y: number) => {
        dispatch(dragStartAction(x, y));
    },[]);
    const dragging = useCallback((x: number, y: number) => {
        dispatch(draggingAction(x, y));
    },[]);
    const dragEnd = useCallback((x: number, y: number) => {
        dispatch(dragEndAction(x, y));
    },[]);
    const setZoom = useCallback(({offset, value}) => {
        dispatch(setZoomAction({offset, value}));
    },[]);
    const updateDataFrameDetail = useCallback((detail: DataFrameDetailType) => {
        dispatch(updateDataFrameDetailAction(detail));
    },[]);
    const addNote = useCallback((x: number, y: number) => {
        dispatch(addNoteAction(x, y));
    },[]);
    const sortStepSrcEnd = useCallback((detail: {}, mouseEvent: {}) => {
        // mouseEventは未使用
        dispatch(sortStepSrcEndAction(detail, mouseEvent));
    },[]);
    const moveSteps = useCallback((x: number, y: number, step) => {
        dispatch(moveStepsAction(x, y, step));
    },[]);
    const resizeInspector = useCallback((width: number) => {
        dispatch(resizeInspectorAction(width));
    },[]);

    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [lockUUID, setLockUUID] = useState<string | undefined>(undefined);

    const hasLockedUUID = useMemo(()=>(lockUUID)?true:false,[lockUUID]); // lockUUIDを保持している際は、編集可能な状態
    const disabled = useMemo(()=>(isLoading || !hasLockedUUID),[isLoading,hasLockedUUID]);

    useEffect(()=>{
        const handleLeavePage = () => {
            if (lockUUID) {
                API.request.doDelete.locks({lockUUID: lockUUID});
            }
        };
        window.addEventListener("beforeunload", handleLeavePage);
        return ()=>{
            window.removeEventListener("beforeunload", handleLeavePage);
        }
    },[lockUUID]);

    useEffect(() => {
        let preRequest: any = [];
        let flowRequest: any = [];

        preRequest.push(APIUtil.get("commands").then((response) => {
            const json = response.data;
            const commands = json.data.map((command) => {
                return new CommandModel(command);
            });
            window.commands = commands;
            addMaster({commands: commands});
        }).then((response) => {
            },
            (error) => {
                console.log(error);
            }));

        preRequest.push(APIUtil.get("visualizers").then((response) => {
            const json = response.data;
            const visualizers = json.data.map((visualize) => {
                return new VisualizeModel(visualize);
            });
            window.visualizers = visualizers;
            addMaster({visualizers: visualizers})
        }).then((response) => {
            },
            (error) => {
                console.log(error);
            }));

        preRequest.push(APIUtil.get("subflows").then((response) => {
            const json = response.data;
            const subflows = json.data.map((subflow: SubFlowParamType) => {
                return new SubflowCommandModel(subflow);
            });
            window.subflows = subflows;
            addMaster({subflows: subflows})
        }).then((response) => {
            },
            (error) => {
                console.log(error);
            }));

        Promise.all(preRequest).then(() => {
            flowRequest.push(APIUtil.get("flows/" + inject_flow_uuid).then((response) => {
                const json = response.data;
                loadFlowJSON(json)
            }));
        }).catch((error) => {
            console.log(error);
        });

        Promise.all(flowRequest).then(() => {

            const flowUUID = inject_flow_uuid;
            let lockUUID;
            API.request.doPost.locks({flowUUID: flowUUID})
                .then((res) => {
                    lockUUID = API.response.post.locks(res).uuid;
                    setLockUUID(lockUUID);
                })
                .catch(e => {
                    if (!lockUUID) {
                        notify({
                            title: "警告：読取専用フロー",
                            message: "このフローはすでに編集中のため、 編集権限が取得できませんでした。",
                            status: "warning",
                            dismissAfter: -1,
                            closeButton: true
                        });
                    } else {
                        notify({
                            title: e.title,
                            message: e.message,
                            status: e.messageStatus,
                            dismissAfter: -1,
                            closeButton: true
                        });
                    }
                }).finally(()=>{
                setIsLoading(false);
            });

        }).catch((error) => {
            console.log(error);
        });
    }, []);

    const renderSteps = () => {
        let steps: any = [];
        if (Array.isArray(nodes)) {
            steps = nodes.map((step: StepModelType) => {
                let selected = (step.id === selected_step_ids[0]);
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
                />;
            });
        }
        return steps;
    };

    const renderEdges = () => {
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
    };

    const renderSelector = () => {
        let selector: any = null;
        if (Object.keys(drag).length) {
            selector = <Selector sx={ZoomUtil.zoomReverse(drag.start.x, zoom)}
                                 sy={ZoomUtil.zoomReverse(drag.start.y, zoom)}
                                 ex={ZoomUtil.zoomReverse(drag.end.x, zoom)}
                                 ey={ZoomUtil.zoomReverse(drag.end.y, zoom)} />;
        }
        return selector;
    };

    return <div className={style.flow_editor_container}>
        <div className={style.flow_editor}>
            <PaperZoom />
            <ToolBar flow={flow}
                     zoom={zoom}
                     lockUUID={lockUUID}
                     nodes={nodes}
                     history={history}
                     notify={notify}
                     dismissNotify={dismissNotify}
                     addStep={addStep}
                     addHistory={addHistory}
                     sortFlow={sortFlow}
                     loadFlowJSON={loadFlowJSON}
                     selectSteps={selectSteps}
                     setZoom={setZoom}
                     undo={undo}
                     redo={redo}
                     disabled={disabled}
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
                selectSteps={selectSteps}
                flow={flow}
                lockUUID={lockUUID}
                inspector={inspector}
                updateFlow={updateFlow}
                notify={notify}
                dismissNotify={dismissNotify}
                selected_data_source_detail={selected_data_source_detail}
                updateDataFrameDetail={updateDataFrameDetail}
                loadFlowJSON={loadFlowJSON}
                deleteSteps={deleteSteps}
                addHistory={addHistory}
                deleteCache={deleteCache}
                updateStep={updateStep}
                sortStepSrcEnd={sortStepSrcEnd}
                resizeInspector={resizeInspector}
            />

            <NotificationManager />
        </div>
    </div>;
};

export {FlowEditor};

//
// export default class FlowEditor extends React.Component<FlowEditorProps, State> {
//
//   constructor(props: FlowEditorProps) {
//     super(props)
//
//     this.state = {
//       isLoading: true,
//       lockUUID: undefined
//     }
//     this.handleLeavePage = this.handleLeavePage.bind(this)
//
//     let preRequest: any = []
//     let flowRequest: any = []
//
//     preRequest.push(APIUtil.get('commands').then((response) => {
//       const json = response.data
//       const commands = json.data.map((command) => {
//         return new CommandModel(command)
//       })
//       window.commands = commands
//       this.props.addMaster({ commands: commands })
//     }).then((response) => { },
//         (error) => { console.log(error) }))
//
//     preRequest.push(APIUtil.get('visualizers').then((response) => {
//       const json = response.data
//       const visualizers = json.data.map((visualize) => {
//         return new VisualizeModel(visualize)
//       })
//       window.visualizers = visualizers
//       this.props.addMaster({ visualizers: visualizers })
//     }).then((response) => { },
//         (error) => { console.log(error) }))
//
//     preRequest.push(APIUtil.get('subflows').then((response) => {
//       const json = response.data
//       const subflows = json.data.map((subflow: SubFlowParamType) => {
//         return new SubflowCommandModel(subflow)
//       })
//       window.subflows = subflows
//       this.props.addMaster({ subflows: subflows })
//     }).then((response) => { },
//         (error) => { console.log(error) }))
//
//     Promise.all(preRequest).then(() => {
//       flowRequest.push(APIUtil.get('flows/' + inject_flow_uuid).then((response) => {
//         const json = response.data
//         this.props.loadFlowJSON(json).then(() => {
//           this.setState({
//             isLoading: false
//           })
//         })
//       }))
//     }).catch((error) => {
//       console.log(error)
//     })
//
//     Promise.all(flowRequest).then(() => {
//
//     }).catch((error) => {
//       console.log(error)
//     })
//   }
//
//   componentWillMount() {
//     const { notify } = this.props
//
//     const flowUUID = inject_flow_uuid
//     let lockUUID
//     API.request.doPost.locks({ flowUUID: flowUUID })
//       .then((res) => {
//         lockUUID = API.response.post.locks(res).uuid
//         this.setState({
//           lockUUID: lockUUID,
//           isLoading: false
//         })
//       })
//       .catch(e => {
//         if (!lockUUID) {
//           notify({
//             title: "警告：読取専用フロー",
//             message: "このフローはすでに編集中のため、 編集権限が取得できませんでした。",
//             status: "warning",
//             dismissAfter: -1,
//             closeButton: true
//           })
//         } else {
//           notify({
//             title: e.title,
//             message: e.message,
//             status: e.messageStatus,
//             dismissAfter: -1,
//             closeButton: true
//           })
//         }
//       })
//   }
//
//   componentDidMount() {
//     window.addEventListener('beforeunload', this.handleLeavePage);
//   }
//
//   componentWillUnmount() {
//     window.removeEventListener('beforeunload', this.handleLeavePage);
//   }
//
//
//   handleLeavePage(e) {
//     if (this.state.lockUUID) {
//       API.request.doDelete.locks({ lockUUID: this.state.lockUUID })
//     }
//   }
//
//   renderSteps() {
//     let { nodes, selected_step_ids, mast, zoom, drag, addSelectStep, deleteSelectStep, updateDataFrameDetail, updateStep, flow, selectSteps, moveSteps } = this.props
//     let steps: any = []
//     if (Array.isArray(nodes)) {
//       steps = nodes.map((step: StepModelType) => {
//         let selected = (step.id === selected_step_ids[0])
//         return <Step
//           key={step.id}
//           model={step}
//           position={step.position}
//           type={step.type}
//           selected={selected}
//           text={step.text}
//           invalid={step.invalid}
//           error={step.error}
//           mast={mast}
//           flow={flow}
//           selected_step_ids={selected_step_ids}
//           zoom={zoom}
//           drag={drag}
//           addSelectStep={addSelectStep}
//           deleteSelectStep={deleteSelectStep}
//           selectSteps={selectSteps}
//           updateDataFrameDetail={updateDataFrameDetail}
//           updateStep={updateStep}
//           moveSteps={moveSteps}
//         />
//       })
//     }
//     return steps
//   }
//
//   renderEdges() {
//     let { nodes, graph } = this.props
//     let edges: any = []
//     if (Array.isArray(graph.edges)) {
//       graph.edges.forEach((edge, index) => {
//         const v_node = GraphUtil.getNode(nodes, edge.v)　// 入力元ノード
//         const w_node = GraphUtil.getNode(nodes, edge.w)　// 出力元ノード
//
//         if (v_node && w_node) {
//           const vx = v_node.position.x +
//             Constants.default.datasource.width / 2
//           const vy = v_node.position.y +
//             Constants.default.datasource.height / 2
//           const wx = w_node.position.x +
//             Constants.default.operator.width / 2
//           const wy = w_node.position.y +
//             Constants.default.operator.height / 2
//           let outPortLabel; // 入力元ノードからの出力ポートラベル
//           let inPortLabel;　// 出力元ノードからの入力ポートラベル
//           //出力先ノードがDataFrameの場合のみ出力もとにラベルを付与する
//           if (w_node instanceof DataFrameStepModel) {
//             outPortLabel = JSON.parse(edge.name).port_name
//           }
//           //入力元ノードがDataFrameの場合のみ出力もとにラベルを付与する
//           if (v_node instanceof DataFrameStepModel) {
//             inPortLabel = JSON.parse(edge.name).port_name;
//           }
//
//           let e = <Edge outPortLabel={outPortLabel} inPortLabel={inPortLabel} vx={vx} vy={vy} wx={wx} wy={wy} key={index} />
//           edges.push(e)
//         }
//       })
//     }
//     return edges
//   }
//
//   renderSelector() {
//     let selector: any = null
//     const { drag, zoom } = this.props
//     if (Object.keys(drag).length) {
//       selector = <Selector sx={ZoomUtil.zoomReverse(drag.start.x, zoom)}
//         sy={ZoomUtil.zoomReverse(drag.start.y, zoom)}
//         ex={ZoomUtil.zoomReverse(drag.end.x, zoom)}
//         ey={ZoomUtil.zoomReverse(drag.end.y, zoom)} />
//     }
//     return selector
//   }
//
//   render() {
//     const { flow, pasteSteps, copySteps, dragStart, drag, selected_step_ids, deleteSteps,
//       nodes, history, notify, dismissNotify, addStep, addHistory, sortFlow, loadFlowJSON, selectSteps,
//       setZoom, undo, redo, dragging, dragEnd, mast, selected_tab_id, updateFlow, selected_data_source_detail,
//       updateDataFrameDetail, deleteCache, updateStep, sortStepSrcEnd, graph, zoom,inspector,
//       resizeInspector, editor } = this.props;
//     const isLoading = (!this.state || this.state.isLoading) ? true : false
//     const isLocked = (this.state && this.state.lockUUID) ? true : false
//     const disabled = (isLoading || !isLocked) ? true : false
//
//     return <div className={style.flow_editor_container}>
//       <div className={style.flow_editor}>
//         <PaperZoom />
//         {/*<SettingsButton {...this.props}/>*/}
//         <ToolBar flow={flow}
//           zoom={zoom}
//           lockUUID={this.state.lockUUID}
//           nodes={nodes}
//           history={history}
//           notify={notify}
//           dismissNotify={dismissNotify}
//           addStep={addStep}
//           addHistory={addHistory}
//           sortFlow={sortFlow}
//           loadFlowJSON={loadFlowJSON}
//           selectSteps={selectSteps}
//           setZoom={setZoom}
//           undo={undo}
//           redo={redo}
//           disabled={disabled}
//         />
//         <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={isLoading}
//           message={'フローを構築中です'} />
//         <PaperScroller
//           editor={editor}
//           pasteSteps={pasteSteps}
//           copySteps={copySteps}
//           deleteSteps={deleteSteps}
//           selectSteps={selectSteps}
//           dragStart={dragStart}
//           dragging={dragging}
//           dragEnd={dragEnd}
//           addHistory={addHistory}
//           redo={redo}
//           undo={undo}
//           selected_step_ids={selected_step_ids}
//           nodes={nodes}
//           history={history}
//           drag={drag}
//         >
//           <Paper graph={graph} zoom={zoom}>
//             {this.renderEdges()}
//             {this.renderSteps()}
//             {this.renderSelector()}
//           </Paper>
//         </PaperScroller>
//         <Inspector
//           selected_step_ids={selected_step_ids}
//           nodes={nodes}
//           mast={mast}
//           selected_tab_id={selected_tab_id}
//           addStep={addStep}
//           selectSteps={selectSteps}
//           flow={flow}
//           lockUUID={this.state.lockUUID}
//           inspector={inspector}
//           updateFlow={updateFlow}
//           notify={notify}
//           dismissNotify={dismissNotify}
//           selected_data_source_detail={selected_data_source_detail}
//           updateDataFrameDetail={updateDataFrameDetail}
//           loadFlowJSON={loadFlowJSON}
//           deleteSteps={deleteSteps}
//           addHistory={addHistory}
//           deleteCache={deleteCache}
//           updateStep={updateStep}
//           sortStepSrcEnd={sortStepSrcEnd}
//           resizeInspector={resizeInspector}
//         />
//
//         <NotificationManager />
//       </div>
//     </div>
//   }
// }
