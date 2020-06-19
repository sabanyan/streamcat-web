//@flow
import React, {useEffect, useState} from "react";
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
import {StepModelType, SubFlowParamType, DragType} from "Types/index";
import {Inspector} from "Shared/Inspector";
import {DataFrameStepModel, FlowModel, SubflowCommandModel, VisualizeModel} from "Model/index";
import {NotificationManager} from "Shared/Notification";
import {API} from "Modules/api/index";
import {useDispatch, useSelector} from "react-redux";
import {addNotification, removeNotification} from "reapop";
import {
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
    loadFlowJSONAction,
    pasteStepsAction,
    redoAction,
    selectStepsAction,
    selectTabAction,
    setZoomAction,
    sortFlowAction,
    sortStepSrcEndAction,
    undoAction,
    updateDataFrameDetailAction,
    updateFlowAction,
    updateStepAction,
    moveStepsAction,
    resizeInspectorAction
} from 'Modules/application'
//
// export type FlowEditorProps = {
//     projectId: string,
//     projectName: string,
//     graph: any;
//     loadFlowJSON: Function;
//     addMaster: Function;
//     addStep: Function;
//     selectSteps: Function;
//     addSelectStep: Function;
//     cutSteps: Function;
//     copySteps: Function;
//     pasteSteps: Function;
//     addHistory: Function;
//     undo: Function;
//     redo: Function;
//     deleteSteps: Function;
//     deleteCache: Function;
//     updateStep: Function;
//     updateFlow: Function;
//     sortFlow: Function;
//     executeFlow: Function;
//     updateDataFrameDetail: Function;
//     nodes: any[];
//     selected_step_ids: string[];
//     selected_tab_id: string;
//     children: React.ReactNode;
//     dragStart: Function;
//     dragging: Function;
//     dragEnd: Function;
//     setZoom: Function;
//     zoom: number;
//     history: any;
//     mast: any;
//     position: any;
//     flow: FlowModel;
//     drag: DragType;
//     inspector:{width:number};
//     editor: {};
//     selected_data_source_detail: Function;
//     sortStepSrcEnd: Function;
//     deleteSelectStep: Function;
//     notify: Function;
//     updateNotify: Function;
//     dismissNotify: Function;
//     addNote: Function;
//     sortStepSrcEndAction: Function;
//     moveSteps: Function;
//     resizeInspector: Function;
// }

const FlowEditor = () => {

    const flow = useSelector(state => state.flowEditorReducer.flow)
    const drag = useSelector(state => state.flowEditorReducer.drag);
    const selected_step_ids = useSelector(state => state.flowEditorReducer.selected_step_ids);
    const nodes = useSelector(state => state.flowEditorReducer.nodes);
    const history = useSelector(state => state.flowEditorReducer.history);
    const mast = useSelector(state => state.flowEditorReducer.mast);
    const selected_tab_id = useSelector(state => state.flowEditorReducer.selected_tab_id);
    const selected_data_source_detail = useSelector(state => state.flowEditorReducer.selected_data_source_detail);
    const graph = useSelector(state => state.flowEditorReducer.graph);
    const zoom = useSelector(state => state.flowEditorReducer.zoom);
    const inspector = useSelector(state => state.flowEditorReducer.inspector);
    const editor = useSelector(state => state.flowEditorReducer.editor);

    const dispatch = useDispatch();
    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [lockUUID, setLockUUID] = useState<string | undefined>(undefined);

    const hasLockedUUID = (lockUUID)?true:false; // lockUUIDを保持している際は、編集可能な状態
    const disabled = (isLoading || !hasLockedUUID);

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
            dispatch(addMasterAction({commands: commands}));
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
            dispatch(addMasterAction({visualizers: visualizers}));
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
            dispatch(addMasterAction({subflows: subflows}));
        }).then((response) => {
            },
            (error) => {
                console.log(error);
            }));

        Promise.all(preRequest).then(() => {
            flowRequest.push(APIUtil.get("flows/" + inject_flow_uuid).then((response) => {
                const json = response.data;
                dispatch(loadFlowJSONAction(json)).then(() => {

                });
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
                    addSelectStep={()=>{dispatch(addSelectStepAction)}}
                    deleteSelectStep={()=>{dispatch(deleteSelectStepAction)}}
                    selectSteps={()=>{dispatch(selectStepsAction)}}
                    updateDataFrameDetail={()=>{dispatch(updateDataFrameDetailAction)}}
                    updateStep={()=>{dispatch(updateStepAction)}}
                    moveSteps={()=>{dispatch(moveStepsAction)}}
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
                     addStep={()=>{dispatch(addStepAction)}}
                     addHistory={()=>{dispatch(addHistoryAction)}}
                     sortFlow={()=>{dispatch(sortFlowAction)}}
                     loadFlowJSON={()=>{dispatch(loadFlowJSONAction)}}
                     selectSteps={()=>{dispatch(selectStepsAction)}}
                     setZoom={()=>{dispatch(setZoomAction)}}
                     undo={()=>{dispatch(undoAction)}}
                     redo={()=>{dispatch(redoAction)}}
                     disabled={disabled}
            />
            <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={isLoading}
                    message={"フローを構築中です"} />
            <PaperScroller
                editor={editor}
                pasteSteps={()=>{dispatch(pasteStepsAction)}}
                copySteps={()=>{dispatch(copyStepsAction)}}
                deleteSteps={()=>{dispatch(deleteStepsAction)}}
                selectSteps={()=>{dispatch(selectStepsAction)}}
                dragStart={()=>{dispatch(dragStartAction)}}
                dragging={()=>{dispatch(draggingAction)}}
                dragEnd={()=>{dispatch(dragEndAction)}}
                addHistory={()=>{dispatch(addHistoryAction)}}
                redo={()=>{dispatch(redoAction)}}
                undo={()=>{dispatch(undoAction)}}
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
                addStep={()=>{dispatch(addStepAction)}}
                selectSteps={()=>{dispatch(selectStepsAction)}}
                flow={flow}
                lockUUID={lockUUID}
                inspector={inspector}
                updateFlow={()=>{dispatch(updateFlowAction)}}
                notify={notify}
                dismissNotify={dismissNotify}
                selected_data_source_detail={selected_data_source_detail}
                updateDataFrameDetail={()=>{dispatch(updateDataFrameDetailAction)}}
                loadFlowJSON={()=>{dispatch(loadFlowJSONAction)}}
                deleteSteps={()=>{dispatch(deleteStepsAction)}}
                addHistory={()=>{dispatch(addHistoryAction)}}
                deleteCache={()=>{dispatch(deleteCacheAction)}}
                updateStep={()=>{dispatch(updateStepAction)}}
                sortStepSrcEnd={()=>{dispatch(sortStepSrcEndAction)}}
                resizeInspector={()=>{dispatch(resizeInspectorAction)}}
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
