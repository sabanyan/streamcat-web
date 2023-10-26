import { defaultGraphProps, defaultNodeProps } from "Utils/GraphUtil";
import Constants from "Constants/index";
import { FlowUtil, GraphUtil, ModelUtil, ZoomUtil } from "Utils/index";
import { CommandPortType, RunnablesType } from "../types";
import _ from "lodash";
import { AllNodeType, Command, Flow, FlowCommand, InlineFlowCommand } from "Model/Library";
import { BaseFlowNodeType, CommandNodeType, FlowNodeType, FrameNode, FrameNodeType, InlineFlowNode, InlineFlowNodeType } from "Model/Node/NodeTypes";
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
 * 指定された全てのNodeに繋ぐEdgeを再描画する
 * @param nodes 
 * @param edges 
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
            const node = FlowUtil.getNode(nodes, id);
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
 * 
 * @param flowData ノードを追加する
 * @param addNode 
 * @param srcNodes 
 * @param dstNodes 
 * @param runnables 
 * @param zoom 
 */
export const addNodeAction = (flowData: Flow,
                              addNode: AllNodeType,
                              srcNodes: AllNodeType[],
                              dstNodes: AllNodeType[],
                              runnables: RunnablesType,
                              zoom: number) => {

    // let offsetX = 0;
    // let hasNode = (from_step_ids)?(graph.outEdges(from_step_ids[0]).length):false
    // if(hasNode){
    //     offsetX = defaultNodeProps.width + 100
    // }

    //ノードの追加
    graphUtil.addNode(addNode.id);

    if (addNode.type === 'command' || addNode.type === 'flow') {
        const newRunableNode = addNode as CommandNodeType | FlowNodeType | InlineFlowNodeType;

        let totalSX = 0;
        let totalSY = 0;

        srcNodes.forEach(srcNode => {
            // const target: AllNodeType = FlowUtil.getNode(flowData.nodes, id);
            totalSX = totalSX + srcNode.position.x;
            totalSY = totalSY + srcNode.position.y;
        });

        //dsts
        let totalDX = 0;
        dstNodes.forEach(dstNode => {
            //ノードの数に応じて
            totalDX = totalDX + defaultGraphProps.nodeSeparator;
        });

        //
        //   ○[     ]○[     ]○
        //   ↑ノード↑nodeSeparator という配置になるため、
        //   末尾のnodeSeparatorを引いておく
        //
        if (totalDX) totalDX = totalDX - defaultGraphProps.nodeSeparator;

        if (srcNodes || dstNodes) {
            //追加したNodeの位置調整
            let average = {
                sx: totalSX / srcNodes.length,
                sy: totalSY / srcNodes.length,
                dx: totalDX / 2
            };

            if (!srcNodes.length) {
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

            const adjustment = 12;
            const newPosition = {
                x: average.sx,
                y: average.sy + Constants.default.step.height + defaultGraphProps.rankSeparator - adjustment
            };

            //追加されたノードの位置調整
            newRunableNode.position = {x:newPosition.x, y:newPosition.y};
            newRunableNode.size = {width:defaultNodeProps.width, height:defaultNodeProps.height};

            //追加したノードが他のノードと位置が重複していた場合ちょっとずらす処理
            const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition({ ...newRunableNode.position }, flowData.nodes);
            const notOverlapOffsetX = notOverlapNodePosition.x - newRunableNode.position.x;
            const notOverlapOffsetY = notOverlapNodePosition.y - newRunableNode.position.y;
            if (notOverlapOffsetX !== 0 || notOverlapOffsetY !== 0) {
                //再調整
                newRunableNode.position = {x:notOverlapNodePosition.x, y:notOverlapNodePosition.y};
                newRunableNode.size = {width:defaultNodeProps.width, height:defaultNodeProps.height};
            }

            //先行して設置されている接続先のノードの位置調整
            dstNodes.map((dstNode, index) => {
                dstNode.position = {
                    x: newRunableNode.position.x - average.dx + index * (defaultNodeProps.width + defaultGraphProps.nodeSeparator + notOverlapOffsetX),
                    y: newRunableNode.position.y + defaultNodeProps.height + defaultGraphProps.rankSeparator
                };
                dstNode.size = {width:defaultNodeProps.width, height:defaultNodeProps.height};
                flowData.nodes = FlowUtil.updateNode({ nodes: flowData.nodes, id: dstNode.id, new_node: dstNode });
            });
            //出力先Nodeの位置調整

            //コマンドのポート名に合わせて srcs,dsts のキー値を指定する
            let command:Command|FlowCommand|null = null;
            let isAddable:boolean;
            if (newRunableNode.type === 'flow') {
                const flowNode = newRunableNode as FlowNodeType;
                command = runnables.subflows.getCommand(flowNode.uuid);
                // フローの入力ポートは不変
                isAddable = flowNode.addableInPort();
            } else if (newRunableNode.type === 'command') {
                const commandNode = newRunableNode as CommandNodeType;
                command = runnables.commands.getCommand(commandNode.commandId);
                // Command引数に初期値があれば設定する
                commandNode.args = commandNode.args || {};
                command && command.params.filter(param => param.default!==undefined).forEach(param => {
                    commandNode.args![param.name] = param.default;
                });
                // コマンドの入力ポートが可変な場合はtrue
                isAddable = !!command && commandNode.addableInPort(command);
            }

            if(!command){
                throw new Error('invalid node type at here');
            }

            const inPorts: CommandPortType[] = command.ports[0];
            const outPorts: CommandPortType[] = command.ports[1];
            srcNodes.forEach((srcNode, index) => {
                const newPort = inPorts[index];
                let portLabel = isAddable ? "*" + index : newPort.label;
                if (newRunableNode.type === 'flow') {
                    portLabel = newPort.label;
                }

                newRunableNode.addInPort(portLabel, srcNode.id);

                //srcsがあった場合は１つ目のポート名につなぐ
                //srcsがない場合は、デフォルト値（i）のポートにつなぐ
                const from: string = srcNode.id;
                const to: string = newRunableNode.id;
                let inputPortLabel = Constants.default.command.inputPortLabel;
                if (newRunableNode.srcs !== undefined || !_.isEmpty(newRunableNode.srcs)) {
                    const srcs = newRunableNode.srcs || {};
                    inputPortLabel = Object.keys(srcs).find(key => srcs[key] === srcNode.id) || "";
                }
                graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));

            });

            newRunableNode.dsts = newRunableNode.dsts || {};
            dstNodes.forEach((dstNode, index) => {
                const newPort = outPorts[index];
                let portLabel = newPort.label;
                if (newRunableNode.type === 'flow') {
                    portLabel = newPort.label;
                }

                newRunableNode.dsts![portLabel] = dstNode.id;

                //dstsがあった場合は１つ目のポート名につなぐ
                //dstsがない場合は、デフォルト値（i）のポートにつなぐ
                const from: string = newRunableNode.id;
                const to: string = dstNode.id;
                let outputPortLabel = Constants.default.command.outputPortLabel;
                if (newRunableNode.dsts !== undefined || !_.isEmpty(newRunableNode.dsts)) {
                    const dsts = newRunableNode.dsts || {};
                    outputPortLabel = Object.keys(dsts).find(key => dsts[key] === dstNode.id) || "";
                }
                graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, outputPortLabel));
            });
        } else {
            newRunableNode.srcs = {};
            newRunableNode.dsts = {};
            newRunableNode.position = {x:0, y:0};
            newRunableNode.size = {width:defaultNodeProps.width, height:defaultNodeProps.height};
        }
    }

    if (addNode.type === 'frame') {
        const newFrameNode = addNode as FrameNodeType;
        newFrameNode.position = {
            x: window.innerWidth / 2 - defaultNodeProps.width / 2,
            y: window.innerHeight / 2 - defaultNodeProps.height / 2,
        };
        newFrameNode.size = {
            width: defaultNodeProps.width,
            height: defaultNodeProps.height
        };
    }

    // newState.nodes.push(add_step);
    flowData.nodes.push(addNode);
    // newState.graph = graphUtil.getGraph(flowData.nodes, action.zoom);
};

/**
 * ノードを削除する
 * @param flowData 
 * @param nodes 
 */
export const deleteNodesAction = (flowData:Flow, nodes:AllNodeType[]) => {

    let deleteKeySet = new Set<string>();
    //削除対象がデータフレームの場合、srcも削除対象とする
    //ただしsrcが別のデータフレームを複数出力している場合があるので、
    //一つでもデータフレームが残っていると削除は行わない
    nodes.forEach(node => {
        if (node.type === 'frame') {
            // 削除対象ノードがFrameの場合、そのFrameを出力先とするCommand(またはFlow)も削除する
            if (graphUtil.g.inEdges(node.id) && graphUtil.g.inEdges(node.id).length > 0) {
                const deleteTargetNodeId = graphUtil.g.inEdges(node.id)[0].v;
                const deleteTargetNode = FlowUtil.getNode(flowData.nodes, deleteTargetNodeId) as any;
                if (deleteTargetNode.type === 'command' ||
                    deleteTargetNode.type === 'flow' ||
                    (deleteTargetNode.flow && deleteTargetNode.classification === "data_source")) {

                    // Command(またはFlow)の出力先Frameの数を取得する
                    let lastDstNodeId:string = '';
                    const dstsLength = Object.values<string>(deleteTargetNode.dsts).map<number>(nodeId => {
                        if(nodeId){
                            lastDstNodeId = nodeId;
                            return 1;
                        }else{
                            // Portに紐づくNodeがない場合はカウントしない
                            return 0;
                        }
                    }).reduce((prevDstCount, dstCount) => {
                        return prevDstCount += dstCount;
                    });

                    // 削除対象ノードがCommand(またはFlow)の最後の出力先Frameの場合は、CommandまたはFlowを削除する
                    const isSingleDsts = dstsLength===1 && lastDstNodeId===node.id;

                    if (isSingleDsts) {
                        // CommandまたはFlowを削除
                        flowData.nodes = graphUtil.removeNode(flowData.nodes, deleteTargetNodeId);
                        deleteKeySet.add(deleteTargetNodeId);
                    }
                }
            }
        } else if (node.hasOwnProperty('flow') && (node as InlineFlowNodeType).classification == 'data_dest'){
            // データデスト削除時、OutPortを解除する
            const dstNode = node as InlineFlowNodeType;
            Object.values(dstNode.srcs || {}).forEach(nodeId => {
                // let srcId = node.srcs[key];
                // newState.flow.deleteOutPortWithId(srcId);
                flowData.ports[1].removeByNodeId(nodeId);
            })
        } else if (node.hasOwnProperty('flow') && (node as InlineFlowNodeType).classification == 'data_source'){
            // データソース削除時、InPortを解除する
            const srcNode = node as InlineFlowNodeType;
            Object.values(srcNode.dsts || {}).forEach(nodeId => {
                // let dstId = node.dsts[key];
                // newState.flow.deleteInPortWithId(srcId);
                flowData.ports[0].removeByNodeId(nodeId);
            })
        }

        //削除対象のノードがIn・OutPortの場合、Portから削除する
        // newState.flow.deleteInPortWithId(id);
        // newState.flow.deleteOutPortWithId(id);
        if(node.type === Constants.node.type.frame){
            flowData.ports[0].removeByNodeId(node.id);
            flowData.ports[1].removeByNodeId(node.id);
        }

        //選択されたノードを削除
        flowData.nodes = graphUtil.removeNode(flowData.nodes, node.id);
        // newState.flow!.nodes = newState.nodes;
        deleteKeySet.add(node.id);
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
 * ノードを複製する
 * @param flowData 
 * @param stringifiedNodes 
 * @returns 
 */
export const pasteNodesAction = (flowData:Flow, stringifiedNodes:string) => {

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
            copiedCmd.srcs![removeSrc] = '';
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

export const addDataSrcNodeAction = (flowData:Flow, dataSrc: Command | FlowCommand | InlineFlowCommand) => {
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

    // データソースと出力ノードを追加する
    flowData.nodes.push(newNode, ...dstNodes);
    // CanvasにNodeを追加する
    graphUtil.addNode(newNode.id);
    // Canvasに出力Nodeを追加する
    dstNodes.forEach(dstNode => graphUtil.addNode(dstNode.id));
    // NodeにEdgeを繋げる
    addNodeEdges(newNode);
};

export const addDataDstNodeAction = (flowData:Flow, dataDst: Command | FlowCommand | InlineFlowCommand, selectedDataNodeId: string) => {
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

    // データデストを追加する
    flowData.nodes.push(newNode);
    // CanvasにNodeを追加する
    graphUtil.addNode(newNode.id);
    // NodeにEdgeを繋げる
    addNodeEdges(newNode);
};
