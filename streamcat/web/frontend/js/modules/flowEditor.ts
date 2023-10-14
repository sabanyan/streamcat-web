import { defaultGraphProps, defaultNodeProps } from "Utils/GraphUtil";
import Constants from "Constants/index";
import { FlowUtil, GraphUtil, ModelUtil, ZoomUtil } from "Utils/index";
import { CommandPortType, RunnablesType } from "../types";
import _ from "lodash";
import { AllNodeType, Command, Flow, FlowCommand, InlineFlowCommand } from "Model/Library";
import { BaseFlowNodeType, CommandNodeType, FlowNodeType, FrameNode, FrameNodeType, InlineFlowNode, InlineFlowNodeType } from "Model/Step/NodeTypes";
import { NodeArray } from "Api";

const LOAD_FLOW_JSON_ACTION = "load_flow_json_action";
const ADD_MASTER_ACTION = "add_master_action";
const ADD_STEP_ACTION = "add_step_action";
const UPDATE_STEP_ACTION = "update_step_action";
const UPDATE_FLOW_ACTION = "update_flow_action";
const SELECT_STEPS_ACTION = "select_steps_action";
const ADD_SELECT_STEP_ACTION = "add_select_step_action";
const DELETE_SELECT_STEP_ACTION = "delete_select_step_action";
const DELETE_STEPS_ACTION = "delete_steps_action";
const DELETE_CACHE_ACTION = "delete_cache_action";
const CUT_STEPS_ACTION = "cut_steps_action";
const COPY_STEPS_ACTION = "copy_steps_action";
const PASTE_STEPS_ACTION = "paste_steps_action";
const ADD_HISTORY_ACTION = "add_history_action";
const UNDO_ACTION = "undo_action";
const REDO_ACTION = "redo_action";
const REFRESH_GRAPH_ACTION = "refresh_graph_action";
const EXECUTE_FLOW_ACTION = "execute_flow_action";
const SORT_FLOW_ACTION = "sort_flow_action";
const SORT_STEP_SRC_END_ACTION = "sort_step_src_end_action";
const SELECT_TAB_ACTION = "select_tab_action";
const DRAG_START_ACTION = "drag_start_action";
const DRAGGING_ACTION = "dragging_action";
const DRAG_END_ACTION = "drag_end_action";
const SET_ZOOM_ACTION = "set_zoom_action";
const UPDATE_DATA_SOURCE_DETAIL_ACTION = "update_data_source_detail_action";
const UPDATE_CACHE_ACTION = "update_cache_action";
const MOVE_STEPS_ACTION = "move_steps_action";
const RESIZE_INSPECTOR_ACTION = "resize_inspector_action";
const REFRESH_CANVAS_SIZE_ACTION = "refresh_canvas_size_action";
const ADD_NOTE_ACTION = "add_note_action";
const SET_EXECUTE_MODE_ACTION = "set_execute_mode_action";
const SET_EDIT_MODE_ACTION = "set_edit_mode_action";
const SET_NETWORK_STATUS = "set_network_status_action";
const REFRESH_FLOW_ACTION = "refresh_flow_action";
const UPDATE_LAST_SAVED_FLOW_ACTION = "update_last_saved_flow_action";
const ADD_DATADST_ACTION = "add_datadst_action";
const ADD_DATASRC_ACTION = "add_datasrc_action";

export const graphUtil: GraphUtil = new GraphUtil();

/**
 * CanvasからEdgeを削除する
 * @param node 
 * @param portLabel 
 */
export const removeNodeEdge = (node:CommandNodeType|BaseFlowNodeType, portLabel:string) => {
    const remove = (fromNodeId:string, toNodeId:string) => {
        if(fromNodeId && toNodeId && graphUtil.existsNode(fromNodeId) && graphUtil.existsNode(toNodeId)){
            graphUtil.removeEdge(fromNodeId, toNodeId, GraphUtil.edgeName(fromNodeId, toNodeId, portLabel));
        }
    };
    // nodeに入るEdgeを削除する
    node.srcs && remove(node.srcs[portLabel], node.id);
    // nodeから出るEdgeを削除する
    node.dsts && remove(node.id, node.dsts[portLabel]);
};

/**
 * CanvasにEdgeを追加する
 * @param newNode 
 */
export const addNodeEdges = (newNode:CommandNodeType|BaseFlowNodeType) => {
    const add = (fromNodeId:string, toNodeId:string, portLabel:string) => {
        // NOTE: Nodeの追加前にEdgeを追加できるようだ
        // if(fromNodeId && toNodeId && graphUtil.existsNode(fromNodeId) && graphUtil.existsNode(toNodeId)){
        if(fromNodeId && toNodeId){
            graphUtil.addEdge(fromNodeId, toNodeId, GraphUtil.edgeName(fromNodeId, toNodeId, portLabel));
        }
    };
    // nodeに入るEdgeを追加する  
    newNode.srcs && Object.entries(newNode.srcs).forEach(([portLabel, srcNodeId]) => {
        add(srcNodeId, newNode.id, portLabel);
    });
    // nodeから出るEdgeを追加する
    newNode.dsts && Object.entries(newNode.dsts).forEach(([portLabel, dstNodeId]) => {
        add(newNode.id, dstNodeId, portLabel);
    });
};

/**
 * エッジのつなぎ直し処理
 * @param newState
 * @param action action.stepに変更後のコマンドステップ or サブフローステップを設定する
 * @returns {*}
 */
export const redrawAllEdges = (nodes:AllNodeType[], edges:{v:string,w:string,name:string}[]) => {
    // 全てのEdgeを削除する
    graphUtil.removeAllEdges(edges);

    // 全てのCommandまたはFlowのEdgeを追加する
    nodes.forEach(node => {
        if(node.type==='command' || node.type==='flow'){
            const runnableNode = node as CommandNodeType|BaseFlowNodeType;
            addNodeEdges(runnableNode);
        }
    });
};

type PositionAndSize = {
    position: {
        x: number
        y: number
    },
    size: {
        width: number
        height: number
    }
}

const defaultNodePositionAndSize = (): PositionAndSize => {
    return {
        position: {
            x: window.innerWidth / 2 - Constants.default.node.width / 2,
            y: window.innerHeight / 2 - Constants.default.node.height / 2,
        },
        size: {
            width: Constants.default.node.width,
            height: Constants.default.node.height
        }
    }
};

const newNodesPositionAndSize = (nodes: AllNodeType[], srcNodeIds: string[] = [], dstNodeIds: string[] = []) => {
    const result: {
        newNodePositionAndSize: PositionAndSize,
        dstNodesPositionAndSize: { [nodeId:string]:PositionAndSize }
    } = {
        newNodePositionAndSize: defaultNodePositionAndSize(),
        dstNodesPositionAndSize: {}
    };

    let totalSX = 0;
    let totalSY = 0;
    let totalDX = 0;
    let average = {
        sx: 0,
        sy: 0,
        dx: 0
    };

    if (srcNodeIds.length > 0) {
        srcNodeIds.forEach((id: string) => {
            const node = GraphUtil.getNode(nodes, id);
            totalSX = totalSX + node.position.x;
            totalSY = totalSY + node.position.y;
        });
        average.sx = totalSX / srcNodeIds.length;
        average.sy = totalSY / srcNodeIds.length;

        result.newNodePositionAndSize.position = {
            x: average.sx,
            y: average.sy + Constants.default.node.height + Constants.default.graph.rankSeparator
        }
    }
    //追加したノードが他のノードと位置が重複していた場合ちょっとずらす処理
    const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition(result.newNodePositionAndSize.position, nodes);
    const notOverlapOffsetX = notOverlapNodePosition.x - result.newNodePositionAndSize.position.x;
    const notOverlapOffsetY = notOverlapNodePosition.y - result.newNodePositionAndSize.position.y;
    if (notOverlapOffsetX !== 0 || notOverlapOffsetY !== 0) result.newNodePositionAndSize.position = notOverlapNodePosition;

    if (dstNodeIds.length > 0) {
        dstNodeIds.forEach(() => {
            //ノードの数に応じて
            totalDX = totalDX + Constants.default.graph.nodeSeparator;
        });
        if (totalDX > 0) totalDX = totalDX - Constants.default.graph.nodeSeparator;

        average.dx = totalDX / 2;

        dstNodeIds.forEach((dstNodeId, index) => {
            result.dstNodesPositionAndSize[dstNodeId] = {
                position: { x: 0, y: 0 },
                size: { width: 0, height: 0 }
            }
            result.dstNodesPositionAndSize[dstNodeId].position.x = result.newNodePositionAndSize.position.x - average.dx + index * (Constants.default.node.width + Constants.default.graph.nodeSeparator + notOverlapOffsetX);
            result.dstNodesPositionAndSize[dstNodeId].position.y = result.newNodePositionAndSize.position.y + Constants.default.node.height + Constants.default.graph.rankSeparator;
            result.dstNodesPositionAndSize[dstNodeId].size.width = Constants.default.node.width;
            result.dstNodesPositionAndSize[dstNodeId].size.height = Constants.default.node.height;
        })
    }

    return result;
};


const newDstNodes = (dstNodeIds: string[],
                     dstNodesPositionAndSize: {}) => {
    let result: FrameNodeType[] = [];

    dstNodeIds.forEach((key: string, index) => {
        // props.id = dstNodeIds[index];
        // props.label = key;
        // props.size = dstNodesPositionAndSize[key].size;
        // props.position = dstNodesPositionAndSize[key].position;

        // const newDstNode = new DataFrameStepModel(props);
        const newDstNode = new FrameNode(dstNodeIds[index], dstNodesPositionAndSize[key].position as {x:number, y:number}) as FrameNodeType;
        newDstNode.label = key;

        result.push(newDstNode);
    })

    return result;
};

type DataSrcProps = {
    id: string
    position: { x: number, y: number }
    dstNodeIds: string[]
    dataSrc: any
    args: {}
};

const newDataSrc = (props: DataSrcProps) => {
    const { id, position, dstNodeIds, dataSrc, args } = props;

    let dsts = {};
    const outPorts: any[] = dataSrc.ports[1];
    outPorts.forEach((outPort, index) => {
        dsts[outPort.label] = dstNodeIds[index];
    });

    const flowNode = new InlineFlowNode(id, dataSrc.classification, dataSrc.flow, position) as InlineFlowNodeType;
    flowNode.label = dataSrc.label;
    flowNode.dsts = dsts;
    flowNode.args = args;
    return flowNode;
};

type DataDestProps = {
    id: string
    position: { x: number, y: number }
    srcNodeIds: string[]
    dataDest: any
    args: {}
};

const newDataDest = (props: DataDestProps) => {
    const { id, position, srcNodeIds, dataDest, args } = props;

    let srcs = {};
    const inPorts: any[] = dataDest.ports[0];
    inPorts.forEach((inPort, index) => {
        srcs[inPort.label] = srcNodeIds[index];
    });

    const flowNode = new InlineFlowNode(id, dataDest.classification, dataDest.flow, position) as InlineFlowNodeType;
    flowNode.label = dataDest.label;
    flowNode.srcs = srcs;
    flowNode.args = args;
    return flowNode;
};

/**
 * ステップの追加
 * @param step
 * @returns {{type: string, step: *}}
 */
export const addStepAction = (flowData:Flow, add_step:any, src_step_ids:string[], dst_step_ids:string[], runnables:RunnablesType, zoom:number) => {

    // let offsetX = 0;
    // let hasNode = (from_step_ids)?(graph.outEdges(from_step_ids[0]).length):false
    // if(hasNode){
    //     offsetX = defaultNodeProps.width + 100
    // }

    //ノードの追加
    graphUtil.addNode(add_step.id);

    if (add_step.type === 'command' || add_step.type === 'flow') {

        let totalSX = 0;
        let totalSY = 0;

        src_step_ids.forEach((id: string) => {
            const target: AllNodeType = GraphUtil.getNode(flowData.nodes, id);
            totalSX = totalSX + target.position.x;
            totalSY = totalSY + target.position.y;
        });

        //dsts
        let totalDX = 0;
        dst_step_ids.forEach((id: string) => {
            //ノードの数に応じて
            totalDX = totalDX + defaultGraphProps.nodeSeparator;
        });

        //
        //   ○[     ]○[     ]○
        //   ↑ノード↑nodeSeparator という配置になるため、
        //   末尾のnodeSeparatorを引いておく
        //
        if (totalDX) totalDX = totalDX - defaultGraphProps.nodeSeparator;

        if (src_step_ids || dst_step_ids) {
            //追加したステップの位置調整
            let average = {
                sx: totalSX / src_step_ids.length,
                sy: totalSY / src_step_ids.length,
                dx: totalDX / 2
            };

            if (!src_step_ids.length) {
                //入力がない場合、グラフの中央を基準にする
                const el = document.querySelector("#flow_editor>div");
                const leftTopPosition = {
                    x: (el && el.scrollLeft) ? el.scrollLeft : 0,
                    y: window.pageYOffset
                };
                average = {
                    sx: ZoomUtil.zoomReverse(leftTopPosition.x + (window.innerWidth - 400) / 2, zoom),
                    sy: ZoomUtil.zoomReverse(leftTopPosition.y + (window.innerHeight - 60) / 2, zoom),
                    dx: totalDX / 2
                };
            }

            const newPosition = {
                x: average.sx,
                y: average.sy + Constants.default.step.height + defaultGraphProps.rankSeparator
            };

            //追加されたノードの位置調整
            add_step.position = {x:newPosition.x, y:newPosition.y};
            add_step.size = {width:defaultNodeProps.width, height:defaultNodeProps.height};

            //追加したノードが他のノードと位置が重複していた場合ちょっとずらす処理
            const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition({ ...add_step.position }, flowData.nodes);
            const notOverlapOffsetX = notOverlapNodePosition.x - add_step.position.x;
            const notOverlapOffsetY = notOverlapNodePosition.y - add_step.position.y;
            if (notOverlapOffsetX !== 0 || notOverlapOffsetY !== 0) {
                //再調整
                add_step.position = {x:notOverlapNodePosition.x, y:notOverlapNodePosition.y};
                add_step.size = {width:defaultNodeProps.width, height:defaultNodeProps.height};
            }

            //先行して設置されている接続先のノードの位置調整
            dst_step_ids.map((id, index) => {
                let new_node = GraphUtil.getNode(flowData.nodes, id);
                new_node.position = {
                    x: add_step.position.x - average.dx + index * (defaultNodeProps.width + defaultGraphProps.nodeSeparator + notOverlapOffsetX),
                    y: add_step.position.y + defaultNodeProps.height + defaultGraphProps.rankSeparator
                };
                new_node.size = {width:defaultNodeProps.width, height:defaultNodeProps.height};
                flowData.nodes = GraphUtil.updateNode({ nodes: flowData.nodes, id: id, new_node: new_node });
            });
            //出力先ステップの位置調整

            //コマンドのポート名に合わせて srcs,dsts のキー値を指定する
            let isAddable = false;
            let command;
            if (add_step.type === 'flow') {
                const node = add_step as FlowNodeType;
                command = runnables.subflows.getCommand(node.uuid);
            } else if (add_step.type === 'command') {
                const node = add_step as CommandNodeType;
                command = runnables.commands.getCommand(node.commandId);
                isAddable = (command as Command).ports[0].length > 0 && (command as Command).ports[0][0].label === '*';
            }
            const inPorts: CommandPortType[] = command.ports[0];
            const outPorts: CommandPortType[] = command.ports[1];
            src_step_ids.forEach((id, index) => {
                const newPort = inPorts[index];
                let portLabel = isAddable ? "*" + index : newPort.label;
                if (add_step.type === 'flow') {
                    portLabel = newPort.label;
                }

                add_step.addInPort(portLabel, id);

                //srcsがあった場合は１つ目のポート名につなぐ
                //srcsがない場合は、デフォルト値（i）のポートにつなぐ
                const from: string = id;
                const to: string = add_step.id;
                let inputPortLabel = Constants.default.command.inputPortLabel;
                if (add_step.srcs !== undefined || !_.isEmpty(add_step.srcs)) {
                    let object = add_step.srcs;
                    inputPortLabel = Object.keys(object).find(key => object[key] === id) || "";
                }
                graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));

            });
            dst_step_ids.forEach((id, index) => {
                const newPort = outPorts[index];
                let portLabel = newPort.label;
                if (add_step.type === 'flow') {
                    portLabel = newPort.label;
                }
                add_step.dsts[portLabel] = id;

                //dstsがあった場合は１つ目のポート名につなぐ
                //dstsがない場合は、デフォルト値（i）のポートにつなぐ
                const from: string = add_step.id;
                const to: string = id;
                let outputPortLabel = Constants.default.command.outputPortLabel;
                if (add_step.dsts !== undefined || !_.isEmpty(add_step.dsts)) {
                    let object = add_step.dsts;
                    outputPortLabel = Object.keys(object).find(key => object[key] === id) || "";
                }
                graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, outputPortLabel));
            });
        } else {
            add_step.srcs = {};
            add_step.dsts = {};
            add_step.position = {x:0, y:0};
            add_step.size = {width:defaultNodeProps.width, height:defaultNodeProps.height};
        }
    }

    if (add_step.type === 'frame') {
        add_step.position = {
            x: window.innerWidth / 2 - defaultNodeProps.width / 2,
            y: window.innerHeight / 2 - defaultNodeProps.height / 2,
        };
        add_step.size = {
            width: defaultNodeProps.width,
            height: defaultNodeProps.height
        };
    }

    // newState.nodes.push(add_step);
    flowData.nodes.push(add_step);
    // newState.graph = graphUtil.getGraph(flowData.nodes, action.zoom);
};

/**
 * ステップの削除
 * @param step_ids
 * @returns {{type: string, step: *}}
 */
export const deleteStepsAction = (flowData:Flow, step_ids:string[]) => {

    let deleteKeySet = new Set<string>();
    //削除対象がデータフレームの場合、srcも削除対象とする
    //ただしsrcが別のデータフレームを複数出力している場合があるので、
    //一つでもデータフレームが残っていると削除は行わない
    step_ids.forEach(id => {
        const step = GraphUtil.getNode(flowData.nodes, id) as any;
        if (GraphUtil.getNode(flowData.nodes, id).type === 'frame') {
            //削除対象のノードの親がある場合、親を調べる
            if (graphUtil.g.inEdges(id) && graphUtil.g.inEdges(id).length > 0) {
                const deleteTargetStepId = graphUtil.g.inEdges(id)[0].v;
                const deleteTargetStep = GraphUtil.getNode(flowData.nodes, deleteTargetStepId) as any;
                if (deleteTargetStep.type === 'command' ||
                    deleteTargetStep.type === 'flow' ||
                    (deleteTargetStep.flow && deleteTargetStep.classification === "data_source")) {
                    //親のコマンドの出力先が対象のデータフレームだけの場合親を削除
                    const isSingleDsts = (Object.keys(deleteTargetStep.dsts).length === 1 && deleteTargetStep.dsts[Object.keys(deleteTargetStep.dsts)[0]] === id);
                    if (isSingleDsts) {
                        //親を削除
                        flowData.nodes = graphUtil.removeNode(flowData.nodes, deleteTargetStepId);
                        deleteKeySet.add(deleteTargetStepId);
                    }
                }
            }
        } else if (step.flow && step.classification === "data_dest") { // データデスト削除時、OutPortを解除する
            Object.keys(step.srcs).forEach((key) => {
                let srcId = step.srcs[key];
                // newState.flow.deleteOutPortWithId(srcId);
                flowData.ports[1].removeByNodeId(srcId);
            })
        } else if (step.flow && step.classification === "data_source") {// データソース削除時、InPortを解除する
            Object.keys(step.dsts).forEach((key) => {
                let dstId = step.dsts[key];
                // newState.flow.deleteInPortWithId(srcId);
                flowData.ports[0].removeByNodeId(dstId);
            })
        }

        //削除対象のノードがIn・OutPortの場合、Portから削除する
        // newState.flow.deleteInPortWithId(id);
        // newState.flow.deleteOutPortWithId(id);
        if(step.type === Constants.node.type.frame){
            flowData.ports[0].removeByNodeId(id);
            flowData.ports[1].removeByNodeId(id);
        }

        //選択されたノードを削除
        flowData.nodes = graphUtil.removeNode(flowData.nodes, id);
        // newState.flow!.nodes = newState.nodes;
        deleteKeySet.add(id);
    });

    // flowData.nodes = GraphUtil.getNewNodesWithExculudeKeys(flowData.nodes, deleteKeySet);

    // 削除対象のNodeを削除する
    flowData.nodes = flowData.nodes.filter(node => !deleteKeySet.has(node.id));
    // newState.flow!.nodes = newState.nodes;
    // newState.graph = graphUtil.getGraph(flowData.nodes, action.zoom);

    //削除後は非選択状態にする
    // newState.selected_step_ids = [];
};

/**
 * ステップのペースト
 * @returns {{type: string, step: *}}
 */
export const pasteStepsAction = (flowData:Flow, stringifiedNodes:string) => {

    // 入出力Portに紐づくNodeのidを置き換える
    const replaceNodeIdInPorts = (ports: {[port:string]:string}, oldNodeId:string, newNodeId:string) => {
        ports && Object.entries(ports).forEach(([portLabel, nodeId]) => {
            if(nodeId === oldNodeId){
                ports[portLabel] = newNodeId;
            }
        });
    };

    // 文字列からNodeオブジェクトを生成する
    let jsonNodes;
    try{
        jsonNodes = JSON.parse(stringifiedNodes);
    } catch (e) {
        // 文字列がJSONでない場合はペースト処理を行わない
        if(e instanceof SyntaxError){
            console.warn(`pasete warning: ${e.message}`);
            return [];
        }else{
            throw e;
        }
    }

    // getNewIdで採番したIdが複製Nodeと重複しないよう
    // 既存のNodeと複製Nodeを併せて保持する
    const allNodes = [...flowData.nodes];

    // 全てのNodeに新規idを設定する
    const convIdTable:{[port:string]:string} = {};
    jsonNodes.forEach(jsonNode => {
        const oldId = jsonNode.id;
        const newId = ModelUtil.getNewId(allNodes, jsonNode.type);
        // Frameのlabelがidと同じ場合は、labelを新規idに変更する
        if(jsonNode.type==='frame' && jsonNode.id===jsonNode.label){
            jsonNode.label = newId;
        }
        // idとlabelを置き換える
        jsonNode.id = newId;
        // 表示位置をずらす
        jsonNode.position = FlowUtil.shiftPosition(jsonNode.position || {x:0,y:0});
        // 新旧のidの対応を控えておく
        convIdTable[oldId] = newId;
        // 採番したidを控えておく
        allNodes.push(jsonNode);
    });

    // 全ての複製Nodeについて入出力Portに紐づくidを置き換える
    jsonNodes.forEach(jsonNode =>
        Object.entries(convIdTable).forEach(([oldId, newId]) => {
            replaceNodeIdInPorts(jsonNode.srcs, oldId, newId);
            replaceNodeIdInPorts(jsonNode.dsts, oldId, newId);
        })
    );

    // Nodeオブジェクトに関数を付与する
    const copiedNodes = new NodeArray(jsonNodes).slice();
    
    const newDstFrames:FrameNodeType[] = [];
    copiedNodes.forEach(copiedNode => {
        // CommandでもFlowでもない場合は何もしない
        if(copiedNode.type!=='command' && copiedNode.type!=='flow'){
            return;
        }

        // 複製したCommandまたはFlow
        const copiedCmd = copiedNode as CommandNodeType|BaseFlowNodeType;

        // CommandまたはFlowの入力元Frameが複製Nodeに含まれていない場合
        // 入力元Frameへの紐付けを削除する
        const removeSrcs:string[] = [];
        copiedCmd.srcs && Object.entries(copiedCmd.srcs).forEach(([portLabel, nodeId]) => {
            // 入力元Frameがコピーに含まれていればFrameを削除処理をしない
            if(copiedNodes.some(copiedNode => copiedNode.id === nodeId)){
                return;
            }
            // 紐付けを削除するPortを保持する
            removeSrcs.push(portLabel);
        });

        // 入力元Frameへの紐付けを削除する
        copiedCmd.srcs && removeSrcs.forEach(removeSrc => {
            delete copiedCmd.srcs![removeSrc];
        });

        // CommandまたはFlowの出力先Frameが複製Nodeに含まれていない場合
        // その出力先Frameを新規作成する
        const newDsts = {};
        copiedCmd.dsts && Object.entries(copiedCmd.dsts).forEach(([portLabel, nodeId]) => {
            // 出力先Frameがコピーに含まれていればFrameを新規作成しない
            if(copiedNodes.some(copiedNode => copiedNode.id === nodeId)){
                return;
            }

            // 新規作成する出力先Frameの配置位置を算出する
            const { dstNodesPositionAndSize } = newNodesPositionAndSize(flowData.nodes, [], ['NEW-FRAME']);

            // 出力先Frameを新規作成する
            const newDstFrame = new FrameNode(
                // NOTE: 複製Nodeとidが重複しないよう留意すること
                ModelUtil.getNewId([...allNodes, ...newDstFrames], 'frame'),
                dstNodesPositionAndSize['NEW-FRAME'].position
            );

            // 新規作成したFrameを保持する
            newDstFrames.push(newDstFrame);

            // Portラベルと出力先Frameを保持する
            newDsts[portLabel] = newDstFrame.id;
        });

        // Commandの出力先に新規作成した出力先Frameを追加する
        copiedCmd.dsts = {...copiedCmd.dsts, ...newDsts};
    });

    // copiedNodesに新規作成したFrameを追加する
    copiedNodes.push(...newDstFrames);

    // Edgeの追加前に全ての複製NodeをCanvasに追加する
    copiedNodes.forEach(copiedNode => graphUtil.addNode(copiedNode.id));

    // 全ての複製Node間のEdgeを追加する
    copiedNodes.forEach(copiedNode => {
        if(copiedNode.type==='command' || copiedNode.type==='flow'){
            addNodeEdges(copiedNode as CommandNodeType|BaseFlowNodeType);
        }
        // 全ての複製NodeをflowDataに保存する
        flowData.nodes.push(copiedNode);
    });

    return copiedNodes;
};

export const addDataSrcStepAction = (flowData:Flow, dataSrc: Command | FlowCommand | InlineFlowCommand) => {
    const id = ModelUtil.getNewId(flowData.nodes, 'datasrc');
    const outPorts = dataSrc.ports[1];

    const dstNodeIds = outPorts.map(() => ModelUtil.getNewId(flowData.nodes, 'frame'));
    const { newNodePositionAndSize, dstNodesPositionAndSize } = newNodesPositionAndSize(flowData.nodes, [], dstNodeIds);
    let args = {};
    // default value
    dataSrc.params.map(param => {
        // default値の適用
        if (param.default) args[param.name] = param.default;
    });

    // new dataSource
    const props = {
        id: id,
        // label: dataSrc.label,
        position: newNodePositionAndSize.position,
        // size: newNodePositionAndSize.size,
        dataSrc: dataSrc,
        dstNodeIds: dstNodeIds,
        args: args,
    }

    const newNode = newDataSrc(props);
    const dstNodes = newDstNodes(dstNodeIds, dstNodesPositionAndSize);
    // データソースの出力ノードをフロー入力Portに設定する
    dstNodes.forEach(dstNode => {
        const port = {
            label: dstNode.label || dstNode.id,
            nodeId: dstNode.id,
            type: dstNode.type
        };
        flowData.ports[0].upsert(port);
    });

    let nodes = flowData.nodes;
    nodes.push(newNode);
    dstNodes.forEach((dstNode) => {
        nodes.push(dstNode);
    })
    flowData.nodes = [...nodes];

    // CanvasにNodeを追加する
    graphUtil.addNode(newNode.id);
    // Canvasに出力Nodeを追加する
    dstNodes.forEach(dstNode => graphUtil.addNode(dstNode.id));
    // NodeにEdgeを繋げる
    addNodeEdges(newNode);
};

export const addDataDstStepAction = (flowData:Flow, dataDst: Command | FlowCommand | InlineFlowCommand, selectedDataNodeId: string) => {
    const srcNodeIds = [selectedDataNodeId];

    const id = ModelUtil.getNewId(flowData.nodes, 'datadst');

    const { newNodePositionAndSize } = newNodesPositionAndSize(flowData.nodes, srcNodeIds, []);

    const srcNodes = flowData.nodes.filter(
        node => srcNodeIds.includes(node.id)
    );

    // データデストの入力ノードをフロー出力Portに設定する
    srcNodes.forEach(srcNode => {
        const port = {
            label: srcNode.label || '',
            nodeId: srcNode.id,
            type: srcNode.type
        };
        flowData.ports[1].upsert(port);
    });

    let args = {};
    // default value
    dataDst.params.map((param: any) => {
        // default値の適用
        if (param.default) args[param.name] = param.default;
    });

    // new dataDest
    const props = {
        id: id,
        // label: dataDst.label,
        position: newNodePositionAndSize.position,
        // size: newNodePositionAndSize.size,
        dataDest: dataDst,
        srcNodeIds: srcNodeIds,
        args: args,
    }

    const newNode = newDataDest(props);
    let nodes = flowData.nodes;
    nodes.push(newNode);
    flowData.nodes = [...nodes];

    // CanvasにNodeを追加する
    graphUtil.addNode(newNode.id);
    // NodeにEdgeを繋げる
    addNodeEdges(newNode);
};
