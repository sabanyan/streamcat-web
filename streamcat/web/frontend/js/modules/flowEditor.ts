import { defaultGraphProps, defaultNodeProps } from "Utils/GraphUtil";
import Constants from "Constants/index";
import { FlowUtil, GraphUtil, ModelUtil, StateUtil, ZoomUtil } from "Utils/index";
import { FlowEditModeValue, FlowExecuteModeValue, NetworkStatusValue } from 'Model/Flow/FlowModel';
import { CommandStepModel, DataFrameStepModel, NoteStepModel, SubFlowStepModel, DataDstStepModel, DataSrcStepModel } from "Model/index";
import { CommandPortType, DragType, GraphType } from "../types";
import _ from "lodash";
import { AllNodeType, Command, Flow, FlowCommand, FlowType, FrameType, InlineFlowCommand, Port } from "Model/Library";
import { Action } from "redux";
import { CommandNodeType, FlowNodeType, FrameNode, FrameNodeType, InlineFlowNode, InlineFlowNodeType, NoteNodeType } from "Model/Step/NodeTypes";

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

export type State = {
  // allowlist: {},
  // selected_step_ids: string[],
  // graph: GraphType,
  // zoom: number,
  // nodes: AllNodeType[],
  // history: {
  //   current: number,
  //   flows: Flow[]
  // },
  // mast: {
  //   commands: any[],
  //   visualizers: any[],
  //   subflows: any[],
  //   datasrcs: any[],
  //   datadsts: any[],
  // },
  // selected_tab_id: number,
  // drag: DragType | {},
  // selected_in_edges: any[],
  // selected_out_edges: any[],
  // selected_data_source_detail?: FrameType,
  // // editor
  // editor: {
  //   width: number,
  //   height?: number,
  //   logBox?: {
  //     height?: number
  //   }
  // },
  // // inspector
  // inspector: {
  //   width: number
  // },
  // folderPath: string | null,
  // folderUuid: string | null,
  // modifiedAt: string | null,
  // networkStatus: NetworkStatusValue,
  // lastSavedFlow?: FlowType,
  // flowData?: Flow,
  // originalFlow?: {}
  // executeMode: FlowExecuteModeValue | null,
  // editMode: FlowEditModeValue | null
}

let flowEditorReducerInitialState: State = {
  // allowlist: {},
  // selected_step_ids: [],
  // graph: graphUtil.getGraph([], 100),
  // zoom: 100,
  // nodes: [],
  // history: {
  //   current: 0,
  //   flows: []
  // },
  // mast: {
  //   commands: [],
  //   visualizers: [],
  //   subflows: [],
  //   datasrcs: [],
  //   datadsts: [],
  // },
  // selected_tab_id: 0,
  // drag: {},
  // selected_in_edges: [],
  // selected_out_edges: [],
  // selected_data_source_detail: undefined,
  // editor
  // editor: {
  //   width: window.innerWidth - Constants.default.inspector.width,
  //   height: undefined,
  //   logBox: {
  //     height: undefined
  //   }
  // },
  // // inspector
  // inspector: {
  //   width: Constants.default.inspector.width
  // },
  // folderPath: null,
  // folderUuid: null,
  // modifiedAt: null,
  // networkStatus: NetworkStatusValue.UnKnown,
  // lastSavedFlow: undefined,
  // flowData: undefined,
  // executeMode: null,
  // editMode: null
};

type FlowEditorAction = Action & {
  flow: FlowType;
  add_step: any;
  src_step_ids: string[];
  dst_step_ids: string[];
  flowData: Flow;
  // lastSavedFlow: FlowType;
  step_ids: string[];
  paste_nodes: any;
  // selected_steps: any[];
  selected_step_id: string;
  // selected_tab_id: number;
  x: number;
  y: number;
  // offset: number;
  // value: number;
  // detail: any;
  payload: {
    dataSrc: Command | FlowCommand | InlineFlowCommand,
    dataDest: Command | FlowCommand | InlineFlowCommand,
    selctedDataNodeId: string,
  };
  step: AllNodeType;
  // width: number;
  // executeMode: FlowExecuteModeValue;
  // editMode: FlowEditModeValue;
  // status: NetworkStatusValue;
  zoom: number;
  selectedStepIds: string[]
};

export const FlowEditorReducer = (state:State = flowEditorReducerInitialState, action:FlowEditorAction) => {
  //http://otiai10.hatenablog.com/entry/2016/04/20/013348
  //stateを一度ディープコピーしないとrenderされないためコピーする
  // let newState: State = StateUtil.deepCopy(state);
  // NOTE: deepCopyすると新規追加したNoteNodeの関数が機能しない
  let newState = {...state};
  switch (action.type) {


    case DELETE_STEPS_ACTION: {

    }

    case PASTE_STEPS_ACTION: {
    }

    case ADD_DATASRC_ACTION: {
    };
      break;

    case ADD_DATADST_ACTION: {
    };
      break;

    default:
      (window as any).nodes = action.flowData?.nodes || [];
      return state;
  }

  if(action.flowData){
    (window as any).nodes = action.flowData.nodes;
  }
  return newState;

};

/**
 * エッジのつなぎ直し処理
 * @param newState
 * @param action action.stepに変更後のコマンドステップ or サブフローステップを設定する
 * @returns {*}
 */
export const rebuildNodesEdges = (nodes:AllNodeType[], action:{step:any}) => {
  return nodes.map((node: any, index) => {
    //入力選択機能やクリップボードのコピーによって再度 結びつきが変更された場合のエッジのつなぎ直し対応
    if (node.id === action.step.id) {
      if (node.type === 'command' ||
        node.type === 'flow' ||
        node.classification === "data_source" ||
        node.classification === "data_dest") {
        if (!_.isEqual(node.srcs, action.step.srcs)) {
          //ノードのつながりを削除
          Object.keys(node.srcs).forEach(portLabel => {
            const id = node.srcs[portLabel];
            const from = id;
            const to = node.id;
            if (GraphUtil.NodeExists(nodes, id)) {
              graphUtil.removeEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
            }
          });
          //ノードのつながりを再構築
          Object.keys(action.step.srcs).forEach(portLabel => {
            const id = action.step.srcs[portLabel];
            const from = id;
            const to = action.step.id;
            if (GraphUtil.NodeExists(nodes, id)) {
              graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
            }
          });
        }
        if (!_.isEqual(node.dsts, action.step.dsts)) {
          //ノードのつながりを削除
          Object.keys(node.dsts).forEach(portLabel => {
            const id = node.dsts[portLabel];
            const from = node.id;
            const to = id;
            if (GraphUtil.NodeExists(nodes, id)) {
              graphUtil.removeEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
            }
          });
          //ノードのつながりを再構築
          Object.keys(action.step.dsts).forEach(portLabel => {
            const id = action.step.dsts[portLabel];
            const from = action.step.id;
            const to = id;
            if (GraphUtil.NodeExists(nodes, id)) {
              graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
            }
          });
        }
      }
      return action.step;
    }
    return node;
  });
};

/**
 * エッジのつなぎ直し処理
 * @param newState
 * @param action action.stepに変更後のコマンドステップ or サブフローステップを設定する
 * @returns {*}
 */
export const allRebuildNodesEdges = (nodes:AllNodeType[], edges:{v:string,w:string,name:string}[]) => {
  //入力選択機能やクリップボードのコピーによって再度 結びつきが変更された場合のエッジのつなぎ直し対応
  graphUtil.removeAllEdges(edges);
  return nodes.map(node => {
    if (node.type === 'command' || node.type === 'flow') {
      const runnableNode = node as CommandNodeType | FlowNodeType | InlineFlowNodeType;
      // 入力Edgeを再生成する
      runnableNode.srcs && Object.keys(runnableNode.srcs).forEach(portLabel => {
        const id = runnableNode.srcs![portLabel];
        const from = id;
        const to = runnableNode.id;
        if (GraphUtil.NodeExists(nodes, id)) {
          graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
        }
      });
      // 出力Edgeを再生成する
      runnableNode.dsts && Object.keys(runnableNode.dsts).forEach(portLabel => {
        const id = runnableNode.dsts![portLabel];
        const from = runnableNode.id;
        const to = id;
        if (GraphUtil.NodeExists(nodes, id)) {
          graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
        }
      });
    }
    return node;
  });
};

export function newNodeId(prefix: string, nodes: AllNodeType[], count: number = 1) {
  let idNumber: string = "";
  let result: string[] = [];
  let tempId = prefix + idNumber;


  let index: number = 0;
  while (index <= nodes.length + 1 && count > 0) {
    const found = nodes.find((node) => {
      return (node.id === tempId)
    })
    if (!found) {
      result.push(tempId);
      count = count - 1;
    }

    tempId = String(prefix + (index + 1));
    index = index + 1;
  }
  return result;
}



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

function defaultNodePositionAndSize(): PositionAndSize {
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
}

function newNodesPositionAndSize(nodes: AllNodeType[], srcNodeIds: string[] = [], dstNodeIds: string[] = []) {
  let result = {
    newNodePositionAndSize: defaultNodePositionAndSize(),
    dstNodesPositionAndSize: {}
  }

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
}


function newDstNodes(nodes:AllNodeType[], dstNodeIds: string[], dstNodesPositionAndSize: {}, props: any) {
  let result: any[] = [];

  dstNodeIds.forEach((key: string, index) => {
    props.id = dstNodeIds[index];
    props.label = key;
    props.size = dstNodesPositionAndSize[key].size;
    props.position = dstNodesPositionAndSize[key].position;

    // const newDstNode = new DataFrameStepModel(props);
    const newId = ModelUtil.getNewId(nodes, 'frame');
    const newDstNode = new FrameNode(newId, dstNodesPositionAndSize[key].position as {x:number, y:number});
    newDstNode.id = dstNodeIds[index];
    newDstNode.label = key;

    result.push(newDstNode);
  })

  return result;
}

function addToGraph(graphUtil: GraphUtil, node: InlineFlowNodeType) {
  // node
  graphUtil.addNode(node.id);
  // src edges
  node.srcs && Object.keys(node.srcs).forEach((key) => {
    const from = node.srcs![key];
    const to = node.id;
    const portLabel = key;
    graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
  })
  // dst edges
  node.dsts && Object.keys(node.dsts).forEach((key) => {
    const to = node.dsts![key];
    const from = node.id;
    const portLabel = key;
    graphUtil.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
    graphUtil.addNode(to);
  })
}

export type DataSrcProps = {
  id: string
  label: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  dstNodeIds: string[]
  dataSrc: any
  args: {}
}

export function newDataSrc(props: DataSrcProps) {
  const { id, position, size, dstNodeIds, dataSrc, args } = props;

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
}

export type DataDestProps = {
  id: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  srcNodeIds: string[]
  dataDest: any
  args: {}
}

export function newDataDest(props: DataDestProps) {
  const { id, position, size, srcNodeIds, dataDest, args } = props;

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
}

/**
 * ステップの追加
 * @param step
 * @returns {{type: string, step: *}}
 */
export const addStepAction = (flowData:Flow, add_step:any, src_step_ids:string[], dst_step_ids:string[], zoom:number) => {

  let offsetX = 0;
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
        command = node.getCommand();
      } else if (add_step.type === 'command') {
        const node = add_step as CommandNodeType;
        command = node.getCommand();
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
    if(step.type === Constants.step.type.frame){
      flowData.ports[0].removeByNodeId(id);
      flowData.ports[1].removeByNodeId(id);
    }

    //選択されたノードを削除
    flowData.nodes = graphUtil.removeNode(flowData.nodes, id);
    // newState.flow!.nodes = newState.nodes;
    deleteKeySet.add(id);
  });

  flowData.nodes = GraphUtil.getNewNodesWithExculudeKeys(flowData.nodes, deleteKeySet);
  // newState.flow!.nodes = newState.nodes;
  // newState.graph = graphUtil.getGraph(flowData.nodes, action.zoom);

  //削除後は非選択状態にする
  // newState.selected_step_ids = [];
};

/**
 * ステップのペースト
 * @returns {{type: string, step: *}}
 */
export const pasteStepsAction = (flowData:Flow, paste_nodes:string) => {
  const add_nodes = JSON.parse(paste_nodes);

  //ペースト時に
  //IDが新規に振られるので、旧のIDを新規のIDに置き換え
  //コマンドのノード間の関連(srcs,dsts)を維持する
  //let convertMap = {}
  //newState.selected_step_ids = []
  add_nodes.forEach((json) => {
    const cacheId = json.id;
    let label = (json.label) ? json.label : cacheId;
    json.id = null;
    json.label = "コピー " + label;
    let newNode: AllNodeType = FlowUtil.setModelType(flowData.nodes, json);

    //ノード本体をコピー
    graphUtil.addNode(newNode.id);
    //newState.selected_step_ids.push(newNode.id);

    //入力値をコピー
    newNode = FlowUtil.copyPositionWithOffsetX(newNode);

    if(newNode.type === 'command' || newNode.type === 'flow'){
      let commandOrFlowNode = newNode as CommandNodeType | FlowNodeType | InlineFlowNodeType;
      commandOrFlowNode = FlowUtil.copySrcs(commandOrFlowNode);
      let newDsts = {};
      commandOrFlowNode.dsts && Object.keys(commandOrFlowNode.dsts).forEach((key) => {
        //出力先を作成し、接続先を変更する
        const copiedStep = FlowUtil.getNodeFromID(flowData.nodes, commandOrFlowNode.dsts![key]) as FrameNodeType;
        // const props: any = {
        //   id: null,
        //   type: Constants.step.type.frame,
        //   uuid: null,
        //   label: "コピー " + copiedStep.label,
        //   dataSource: copiedStep.dataSource,
        //   // srcs: newNode.id,
        //   // dsts: [],
        //   position: copiedStep.position
        // };
        // let add_step = new DataFrameStepModel(props);
        const newId = ModelUtil.getNewId(flowData.nodes, 'frame');
        let add_node:FrameNodeType = new FrameNode(newId, copiedStep.position);
        add_node.label = 'コピー ' + copiedStep.label;
        add_node = FlowUtil.copyPositionWithOffsetX(add_node) as FrameNodeType;
        flowData.nodes.push(add_node);
        //ノード本体をコピー
        graphUtil.addNode(add_node.id);
        //newState.selected_step_ids.push(add_step.id);
        newDsts[key] = add_node.id;
      });
      //convertMap[cacheId] = newNode.id
      commandOrFlowNode.dsts = {};

      flowData.nodes.push(commandOrFlowNode);

      const action_step = _.cloneDeep(commandOrFlowNode);
      action_step.dsts = newDsts;
    
      flowData.nodes = rebuildNodesEdges(flowData.nodes, { step: action_step });
      // newState.flow!.nodes = newState.nodes;
    }
  });
  //newState.nodes = FlowUtil.replaceNodeIds(convertMap,newState.nodes)

  // newState.graph = graphUtil.getGraph(flowData.nodes, action.zoom);
  (window as any).nodes = flowData.nodes;
};

export const addDataSrcStepAction = (flowData:Flow, dataSrc: Command | FlowCommand | InlineFlowCommand) => {
  const id = newNodeId('i', flowData.nodes, 1)[0];
  const outPorts = dataSrc.ports[1];

  const dstNodeIds = newNodeId('d', flowData.nodes, outPorts.length);
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
    label: dataSrc.label,
    position: newNodePositionAndSize.position,
    size: newNodePositionAndSize.size,
    dataSrc: dataSrc,
    dstNodeIds: dstNodeIds,
    args: args,
  }

  let dstProps = {
    uuid: null,
    position: newNodePositionAndSize.position,
    type: Constants.step.type.frame,
    size: newNodePositionAndSize.size,
    dataSource: undefined,
    makeCache: false,
    cacheCreatedAt: "",
  }

  const newNode = newDataSrc(props);
  const dstNodes = newDstNodes(flowData.nodes, dstNodeIds, dstNodesPositionAndSize, dstProps);
  // データソースの出力ノードをフロー入力Portに設定する
  dstNodes.forEach(dstNode => {
    const port = {
      label: dstNode.label,
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
  // newState.flowData!.nodes = [...nodes];
  flowData.nodes = [...nodes];
  addToGraph(graphUtil, newNode);
  // newState.graph = graphUtil.getGraph(flowData.nodes, action.zoom);
}

export const addDataDstStepAction = (flowData:Flow, dataDst: Command | FlowCommand | InlineFlowCommand, selectedDataNodeId: string) => {
  const srcNodeIds = [selectedDataNodeId];

  const id = newNodeId('o', flowData.nodes, 1)[0];

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
    label: dataDst.label,
    position: newNodePositionAndSize.position,
    size: newNodePositionAndSize.size,
    dataDest: dataDst,
    srcNodeIds: srcNodeIds,
    args: args,
  }

  const newNode = newDataDest(props);
  let nodes = flowData.nodes;
  nodes.push(newNode);
  flowData.nodes = [...nodes];
  // newState.nodes = [...nodes]
  // graph
  addToGraph(graphUtil, newNode);
  // newState.graph = graphUtil.getGraph(flowData.nodes, action.zoom);
}
