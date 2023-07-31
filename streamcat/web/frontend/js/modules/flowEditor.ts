import { defaultGraphProps, defaultNodeProps } from "Utils/GraphUtil";
import Constants from "Constants/index";
import { FlowUtil, GraphUtil, StateUtil, ZoomUtil } from "Utils/index";
import { FlowEditModeValue, FlowExecuteModeValue, NetworkStatusValue } from 'Model/Flow/FlowModel';
import { CommandStepModel, DataFrameStepModel, NoteStepModel, SubFlowStepModel, DataDstStepModel, DataSrcStepModel } from "Model/index";
import { CommandPortType, DragType, GraphType, StepModelType } from "../types";
import _ from "lodash";
import { FlowType, FrameType, Port } from "Model/Library";
import { Action } from "redux";

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
const graph: GraphUtil = new GraphUtil();

export type State = {
  // allowlist: {},
  // selected_step_ids: string[],
  graph: GraphType,
  // zoom: number,
  nodes: (CommandStepModel | DataFrameStepModel)[],
  history: {
    current: number,
    nodes: (CommandStepModel | DataFrameStepModel)[][]
  },
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
  lastSavedFlow?: FlowType,
  flow?: FlowType,
  // originalFlow?: {}
  // executeMode: FlowExecuteModeValue | null,
  // editMode: FlowEditModeValue | null
}

let flowEditorReducerInitialState: State = {
  // allowlist: {},
  // selected_step_ids: [],
  graph: graph.getGraph([], 100),
  // zoom: 100,
  nodes: [],
  history: {
    current: 0,
    nodes: []
  },
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
  lastSavedFlow: undefined,
  flow: undefined,
  // executeMode: null,
  // editMode: null
};

type FlowEditorAction = Action & {
  context: FlowType;
  add_step: any;
  src_step_ids: string[];
  dst_step_ids: string[];
  flow: FlowType;
  step_ids: string[];
  paste_nodes: any;
  selected_steps: any[];
  selected_step_id: string;
  selected_tab_id: number;
  x: number;
  y: number;
  // offset: number;
  // value: number;
  detail: any;
  payload: any;
  step: any;
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
    case LOAD_FLOW_JSON_ACTION: {
      let { context } = action;
      const flowJson = graph.load(context.flow);
      // newState.originalFlow = { ...flowJson };
      context.flow.label = context.label;
      // newState.flow = new FlowModel(context);
      newState.flow = context;
      newState.lastSavedFlow = StateUtil.deepCopy(newState.flow);
      newState.nodes = flowJson.nodes;
      newState.graph = graph.getGraph(newState.nodes, action.zoom);
      newState.history.current = 0;
      newState.history.nodes = [[...newState.nodes]];
      // newState.allowlist = flowJson.allowlist;
      // newState.folderPath = context.folderPath;
      // newState.folderUuid = context.folderUuid;
      // newState.modifiedAt = context.modifiedAt;

      // newState.nodesとnewState.history.nodesの参照先が同じ場合、undoがうまくいかないため、一度ディープコピーする
      newState.history = StateUtil.deepCopy(newState.history);
      newState.flow.flow.nodes = newState.nodes;
      break;
    }
    case REFRESH_FLOW_ACTION: {
      let { context } = action;
      const flowJson = graph.load(context.flow);
      // newState.originalFlow = { ...flowJson };
      context.flow.label = context.label;
      newState.flow = context;
      newState.nodes = flowJson.nodes;
      newState.graph = graph.getGraph(newState.nodes, action.zoom);
      // newState.allowlist = flowJson.allowlist;
      // newState.folderPath = context.folderPath;
      // newState.folderUuid = context.folderUuid;
      // newState.modifiedAt = context.modifiedAt;
      // newState.nodesとnewState.history.nodesの参照先が同じ場合、undoがうまくいかないため、一度ディープコピーする
      newState.history = StateUtil.deepCopy(newState.history);
      //読み込み時に Flow、Graph、Nodesの値のバリデーションチェックを行う
      //ValidatorUtil.isFlowModelSchema(newState);
      //ValidatorUtil.isGraphModelSchema(newState);
      //ValidatorUtil.isNodesSchema(newState);
      //ValidatorUtil.nodesValidate(newState.nodes);
      if(newState.flow && newState.flow.flow){
        newState.flow.flow.nodes = newState.nodes;
      }else{
        console.log(`newState.flow is ${newState.flow}`);
      }
      break;
    }
    // case ADD_MASTER_ACTION: {
    //   let { context } = action;
    //   newState.mast = Object.assign(newState.mast, { ...context });
    //   break;
    // }
    case ADD_STEP_ACTION: {
      let { add_step, src_step_ids, dst_step_ids } = action;

      let offsetX = 0;
      // let hasNode = (from_step_ids)?(graph.outEdges(from_step_ids[0]).length):false
      // if(hasNode){
      //     offsetX = defaultNodeProps.width + 100
      // }

      //ノードの追加
      graph.addNode(add_step.id);

      if (add_step instanceof CommandStepModel ||
        add_step instanceof SubFlowStepModel) {

        let totalSX = 0;
        let totalSY = 0;

        src_step_ids.forEach((id: string) => {
          const target: StepModelType = GraphUtil.getNode(state.nodes, id);
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
              sx: ZoomUtil.zoomReverse(leftTopPosition.x + (window.innerWidth - 400) / 2, action.zoom),
              sy: ZoomUtil.zoomReverse(leftTopPosition.y + (window.innerHeight - 60) / 2, action.zoom),
              dx: totalDX / 2
            };
          }

          const newPosition = {
            x: average.sx,
            y: average.sy + Constants.default.step.height + defaultGraphProps.rankSeparator
          };

          //追加されたノードの位置調整
          add_step.setFrame({
            x: newPosition.x,
            y: newPosition.y,
            width: defaultNodeProps.width,
            height: defaultNodeProps.height
          });

          //追加したノードが他のノードと位置が重複していた場合ちょっとずらす処理
          const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition({ ...add_step.position }, newState.nodes);
          const notOverlapOffsetX = notOverlapNodePosition.x - add_step.position.x;
          const notOverlapOffsetY = notOverlapNodePosition.y - add_step.position.y;
          if (notOverlapOffsetX !== 0 || notOverlapOffsetY !== 0) {
            //再調整
            add_step.setFrame({
              x: notOverlapNodePosition.x,
              y: notOverlapNodePosition.y,
              width: defaultNodeProps.width,
              height: defaultNodeProps.height
            });
          }

          //先行して設置されている接続先のノードの位置調整
          dst_step_ids.map((id, index) => {
            let new_node = GraphUtil.getNode(state.nodes, id);
            new_node.setFrame({
              x: add_step.position.x - average.dx + index * (defaultNodeProps.width + defaultGraphProps.nodeSeparator + notOverlapOffsetX),
              y: add_step.position.y + defaultNodeProps.height + defaultGraphProps.rankSeparator,
              width: defaultNodeProps.width,
              height: defaultNodeProps.height
            });
            newState.nodes = GraphUtil.updateNode({ nodes: state.nodes, key: id, new_node: new_node });
          });
          //出力先ステップの位置調整

          //コマンドのポート名に合わせて srcs,dsts のキー値を指定する
          let isAddable = false;
          let command;
          if (add_step instanceof SubFlowStepModel) {
            command = add_step.getCommand();
          } else if (add_step instanceof CommandStepModel) {
            command = add_step.getCommand();
            isAddable = command.isInPortsAddable();
          }
          const inPorts: CommandPortType[] = command.getInPorts();
          const outPorts: CommandPortType[] = command.getOutPorts();
          src_step_ids.forEach((id, index) => {
            const newPort = inPorts[index];
            let portLabel = isAddable ? "*" + index : newPort.label;
            if (add_step instanceof SubFlowStepModel) {
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
            graph.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));

          });
          dst_step_ids.forEach((id, index) => {
            const newPort = outPorts[index];
            let portLabel = newPort.label;
            if (add_step instanceof SubFlowStepModel) {
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
            graph.addEdge(from, to, GraphUtil.edgeName(from, to, outputPortLabel));
          });
        } else {
          add_step.srcs = {};
          add_step.dsts = {};
          add_step.setFrame({ x: 0, y: 0, width: defaultNodeProps.width, height: defaultNodeProps.height });
        }
      }

      if (add_step instanceof DataFrameStepModel) {
        add_step.setFrame({
          x: window.innerWidth / 2 - defaultNodeProps.width / 2,
          y: window.innerHeight / 2 - defaultNodeProps.height / 2,
          width: defaultNodeProps.width,
          height: defaultNodeProps.height
        });
      }

      newState.nodes.push(add_step);
      newState.flow!.flow.nodes = newState.nodes;
      newState.graph = graph.getGraph(newState.nodes, action.zoom);
      break;
    }
    case UPDATE_STEP_ACTION: {

      newState.nodes = rebuildNodesEdges(newState, action);
      newState.flow!.flow.nodes = newState.nodes;

      //選択されているEdgeも更新する
      // newState.selected_in_edges = graph.g.inEdges(state.selected_step_ids[0]);
      // newState.selected_out_edges = graph.g.outEdges(state.selected_step_ids[0]);

      //選択されているstepの値も更新する
      newState.graph = graph.getGraph(newState.nodes, action.zoom);
      break;
    }
    case UPDATE_FLOW_ACTION: {
      newState = { ...newState, flow: action.flow };
      newState.nodes = newState.flow!.flow.nodes;
      break;
    }

    case DELETE_STEPS_ACTION: {
      let deleteKeySet = new Set<string>();
      //削除対象がデータフレームの場合、srcも削除対象とする
      //ただしsrcが別のデータフレームを複数出力している場合があるので、
      //一つでもデータフレームが残っていると削除は行わない
      action.step_ids.forEach((id) => {
        const step = GraphUtil.getNode(newState.nodes, id);
        if (GraphUtil.getNode(newState.nodes, id) instanceof DataFrameStepModel) {
          //削除対象のノードの親がある場合、親を調べる
          if (graph.g.inEdges(id) && graph.g.inEdges(id).length > 0) {
            const deleteTargetStepId = graph.g.inEdges(id)[0].v;
            const deleteTargetStep = GraphUtil.getNode(newState.nodes, deleteTargetStepId);
            if (deleteTargetStep instanceof CommandStepModel ||
              deleteTargetStep instanceof SubFlowStepModel ||
              (deleteTargetStep.flow && deleteTargetStep.classification === "data_source")) {
              //親のコマンドの出力先が対象のデータフレームだけの場合親を削除
              const isSingleDsts = (Object.keys(deleteTargetStep.dsts).length === 1 && deleteTargetStep.dsts[Object.keys(deleteTargetStep.dsts)[0]] === id);
              if (isSingleDsts) {
                //親を削除
                newState.nodes = graph.removeNode(newState.nodes, deleteTargetStepId);
                deleteKeySet.add(deleteTargetStepId);
              }
            }
          }
        } else if (step.flow && step.classification === "data_dest") { // データデスト削除時、OutPortを解除する
          Object.keys(step.srcs).forEach((key) => {
            let srcId = step.srcs[key];
            // newState.flow.deleteOutPortWithId(srcId);
            newState.flow!.flow.ports[1].removeByNodeId(srcId);
          })
        } else if (step.flow && step.classification === "data_source") {// データソース削除時、InPortを解除する
          Object.keys(step.dsts).forEach((key) => {
            let dstId = step.dsts[key];
            // newState.flow.deleteInPortWithId(srcId);
            newState.flow!.flow.ports[0].removeByNodeId(dstId);
          })
        }

        //削除対象のノードがIn・OutPortの場合、Portから削除する
        // newState.flow.deleteInPortWithId(id);
        // newState.flow.deleteOutPortWithId(id);
        if(step.type === Constants.step.type.frame){
          newState.flow!.flow.ports[0].removeByNodeId(id);
          newState.flow!.flow.ports[1].removeByNodeId(id);
        }

        //選択されたノードを削除
        newState.nodes = graph.removeNode(newState.nodes, id);
        newState.flow!.flow.nodes = newState.nodes;
        deleteKeySet.add(id);
      });

      newState.nodes = GraphUtil.getNewNodesWithExculudeKeys(newState.nodes, deleteKeySet);
      newState.flow!.flow.nodes = newState.nodes;
      newState.graph = graph.getGraph(newState.nodes, action.zoom);

      //削除後は非選択状態にする
      // newState.selected_step_ids = [];
      break;
    }
    // case CUT_STEPS_ACTION: {
    //   let newState = StateUtil.deepCopy(state)
    //   let deleteKeySet = new Set()
    //   action.step_ids.forEach((id:string)=>{
    //     newState.nodes = graph.removeNode(newState.nodes,[id])
    //     deleteKeySet.add(id)
    //   })
    //   newState.nodes = GraphUtil.getNewNodesWithExculudeKeys(newState.nodes,deleteKeySet)
    //   newState.graph = graph.getGraph(newState)
    //
    //   //削除後は非選択状態にする
    //   newState.selected_step_ids = []
    //
    //   return newState
    // }
    case PASTE_STEPS_ACTION: {
      let newState: State = StateUtil.deepCopy(state);
      const add_nodes = JSON.parse(action.paste_nodes);

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
        let newNode: StepModelType = FlowUtil.setModelType(json);

        //ノード本体をコピー
        graph.addNode(newNode.id);
        //newState.selected_step_ids.push(newNode.id);

        //入力値をコピー
        newNode = FlowUtil.copySrcs(newNode);
        newNode = FlowUtil.copyPositionWithOffsetX(newNode);
        let newDsts = {};
        Object.keys(newNode.dsts).forEach((key) => {
          //出力先を作成し、接続先を変更する
          const copiedStep: DataFrameStepModel = FlowUtil.getNodeFromID(newState.nodes as [any], newNode.dsts[key]);
          const props: any = {
            id: null,
            type: Constants.step.type.frame,
            uuid: null,
            label: "コピー " + copiedStep.getLabel(),
            dataSource: copiedStep.dataSource,
            // srcs: newNode.id,
            // dsts: [],
            position: copiedStep.position
          };
          let add_step = new DataFrameStepModel(props);
          add_step = FlowUtil.copyPositionWithOffsetX(add_step);
          newState.nodes.push(add_step);
          //ノード本体をコピー
          graph.addNode(add_step.id);
          //newState.selected_step_ids.push(add_step.id);
          newDsts[key] = add_step.id;
        });
        //convertMap[cacheId] = newNode.id
        newNode.dsts = {};
        newState.nodes.push(newNode);

        const action_step = _.cloneDeep(newNode);
        action_step.dsts = newDsts;

        newState.nodes = rebuildNodesEdges(newState, { step: action_step });
        newState.flow!.flow.nodes = newState.nodes;
      });
      //newState.nodes = FlowUtil.replaceNodeIds(convertMap,newState.nodes)

      newState.graph = graph.getGraph(newState.nodes, action.zoom);
      (window as any).nodes = newState.nodes;

      return newState;
    }
    case ADD_HISTORY_ACTION: {
      //let newState = StateUtil.deepCopy(state)
      // #issue 188の対応
      // 親・子関係のコマンド（c）、データフレーム（d）がある場合、n番目のヒストリで
      // dを削除したら、n-1番目のヒストリのcのdstもなくなる
      newState.history = StateUtil.deepCopy(newState.history);
      const isSame = FlowUtil.isSameCurrentNodesToBeforeHistoryNodes(newState.history, newState.nodes);

      if (isSame) {
        return newState;
      }

      if (newState.history.current != newState.history.nodes.length - 1) {
        //前に戻っている状態で履歴が追加された場合は、
        //current以降の履歴は消す
        newState.history.nodes = newState.history.nodes.slice(0, newState.history.current + 1);
        newState.history.nodes.push(newState.nodes);
        newState.history.current = newState.history.nodes.length - 1;
      } else {
        newState.history.nodes.push(newState.nodes);
        newState.history.current = newState.history.nodes.length - 1;
      }

      return newState;
    }
    case UNDO_ACTION: {
      let newState: State = StateUtil.deepCopy(state);
      if (newState.history.current > 0) {
        //一つ前に巻き戻し
        newState.history.current = newState.history.current - 1;
        newState.nodes = state.history.nodes[newState.history.current];
        newState.flow!.flow.nodes = newState.nodes;
        allRebuildNodesEdges(newState);
        (window as any).nodes = newState.nodes;

        newState.graph = graph.getGraph(newState.nodes, action.zoom);
      }
      return newState;
    }
    case REDO_ACTION: {
      let newState: State = StateUtil.deepCopy(state);
      const max = newState.history.nodes.length;
      if (newState.history.current < max) {
        //一つ前に巻き戻し
        newState.history.current = newState.history.current + 1;
        newState.nodes = state.history.nodes[newState.history.current];
        newState.flow!.flow.nodes = newState.nodes;
        allRebuildNodesEdges(newState);
        (window as any).nodes = newState.nodes;
        newState.graph = graph.getGraph(newState.nodes, action.zoom);
      }
      return newState;
    }
    // case SELECT_STEPS_ACTION: {
    //   if (action.selected_steps && action.selected_steps.length === 1) {
    //     newState.selected_step_ids = action.selected_steps.map((step) => step.id);
    //     const selected_id = action.selected_steps[0].id;
    //     // newState.selected_in_edges = graph.g.inEdges(selected_id);
    //     // newState.selected_out_edges = graph.g.outEdges(selected_id);
    //   } else {
    //     newState.selected_step_ids = [];
    //     // newState.selected_in_edges = [];
    //     // newState.selected_out_edges = [];
    //   }
    //   break;
    // }
    // case ADD_SELECT_STEP_ACTION: {
    //   if (action.selected_step_id) {
    //     let new_selected_step_ids = newState.selected_step_ids;
    //     new_selected_step_ids.push(action.selected_step_id);
    //     newState.selected_step_ids = [...new Set(new_selected_step_ids)];
    //     return newState;
    //   }
    //   break;
    // }

    // case DELETE_SELECT_STEP_ACTION: {
    //   if (action.selected_step_id) {
    //     newState.selected_step_ids = newState.selected_step_ids.filter((id) => {
    //       if (id === action.selected_step_id) {
    //         return false;
    //       }
    //       return true;
    //     });
    //     return newState;
    //   }
    //   break;
    // }

    case DELETE_CACHE_ACTION: {
      const id = action.selected_step_id;
      let node = GraphUtil.getNode(state.nodes, id);
      if (node instanceof DataFrameStepModel) {
        node.deleteCache();
      }

      newState.nodes = GraphUtil.updateNode({ nodes: state.nodes, key: id, new_node: node });
      newState.flow!.flow.nodes = newState.nodes;
      break;
    }

    case SORT_FLOW_ACTION: {
      // memoはソート対象外にする
      let targets = newState.nodes.filter((node) => {
        // return !(node instanceof NoteStepModel);
        return node.type !== 'note';
      });
      graph.refreshPosition(targets); //ノード位置を再計算
      newState.graph = graph.getGraph(newState.nodes, action.zoom);
      break;
    }
    // case EXECUTE_FLOW_ACTION: {
    //   let newState = StateUtil.deepCopy(state)
    //   let newSteps = {}
    //   Object.keys(newState.nodes).map((key)=>{
    //     if(newState.nodes[key] instanceof DataSourceModel) {
    //         newState.nodes[key].property.hasData = true
    //       }
    //       newSteps[key] = newState.nodes[key]
    //   })
    //   newState.nodes = newSteps
    //   return newState
    // }
    case DRAG_START_ACTION: {
      newState = {
        ...state,
        // drag: {
        //   start: {
        //     x: action.x,
        //     y: action.y
        //   },
        //   end: {
        //     x: action.x,
        //     y: action.y
        //   }
        // },
        graph: {
          ...state.graph,
          width: (action.x > state.graph.width) ? action.x : state.graph.width,
          height: (action.y > state.graph.height) ? action.y : state.graph.height
        }
      };
      break;
    }
    case DRAGGING_ACTION: {
      newState = {
        ...state,
        // drag: {
        //   ...state.drag,
        //   end: {
        //     x: action.x,
        //     y: action.y
        //   }
        // },
        graph: {
          ...state.graph,
          width: (action.x > state.graph.width) ? action.x : state.graph.width,
          height: (action.y > state.graph.height) ? action.y : state.graph.height
        }
      };
      break;
    }
    // case DRAG_END_ACTION: {
    //   newState = { ...state, drag: {} };
    //   break;
    // }

    case SET_ZOOM_ACTION: {
      // const { offset, value } = action;
      // if (offset === undefined) {
      //   //絶対値
      //   newState = { ...state, zoom: value };
      // } else if (state.zoom + offset >= 40 && state.zoom + offset <= 180) {
      //   //差分
      //   newState = { ...state, zoom: state.zoom + offset };
      // }
      newState.graph = graph.getGraph(state.nodes, action.zoom);
      break;
    }

    // case UPDATE_DATA_SOURCE_DETAIL_ACTION: {
    //   newState.selected_data_source_detail = action.detail;
    //   break;
    // }

    // case SORT_STEP_SRC_END_ACTION: {
    //   newState.nodes.forEach((node:any, index) => {
    //     if (node.id == state.selected_step_ids[0] && node.onSortEnd) {
    //       node.onSortEnd(action.payload.oldIndex, action.payload.newIndex);
    //     }
    //   });
    //   newState.flow!.flow.nodes = newState.nodes;
    //   break;
    // }

    case MOVE_STEPS_ACTION: {
      const { x, y, step, selectedStepIds, zoom } = action;
      const { nodes } = newState;

      if (selectedStepIds.length > 0 && step) {
        const dx = (step.position.x - x);
        const dy = (step.position.y - y);

        nodes.map((node, index) => {
          if (selectedStepIds.includes(node.id)) {
            node.position.x = node.position.x - dx;
            node.position.y = node.position.y - dy;
          }
        });
        newState.flow!.flow.nodes = newState.nodes;
        newState.graph = graph.getGraph(newState.nodes, zoom);
      }

      break;
    }

    // case RESIZE_INSPECTOR_ACTION: {
    //   newState = {
    //     ...newState,
    //     inspector: {
    //       width: action.width
    //     },
    //     editor: {
    //       width: (window as any).innerWidth - action.width
    //     }
    //   };
    //   break;
    // }

    // case REFRESH_CANVAS_SIZE_ACTION: {
    //   newState = {
    //     ...newState,
    //     editor: {
    //       width: (window as any).innerWidth
    //     }
    //   };
    //   break;
    // }

    // case SET_EDIT_MODE_ACTION: {
    //   newState = {
    //     ...newState,
    //     editMode: action.editMode
    //   };
    //   break;
    // }

    // case SET_NETWORK_STATUS: {
    //   newState = {
    //     ...newState,
    //     networkStatus: action.status
    //   };
    //   break;
    // }

    // case SET_EXECUTE_MODE_ACTION: {
    //   newState = {
    //     ...newState,
    //     executeMode: action.executeMode
    //   };
    //   break;
    // }

    case UPDATE_LAST_SAVED_FLOW_ACTION: {
      newState = {
        ...newState,
        lastSavedFlow: newState.flow
      };
      break;
    }

    case ADD_DATASRC_ACTION: {
      const { dataSrc } = action.payload;
      const id = newNodeId('i', newState.flow!.flow.nodes, 1)[0];
      const outPorts: Port[] = dataSrc.ports[1];

      const dstNodeIds = newNodeId('d', newState.flow!.flow.nodes, outPorts.length);
      const { newNodePositionAndSize, dstNodesPositionAndSize } = newNodesPositionAndSize(graph, newState.flow!.flow.nodes, [], dstNodeIds);
      let args = {};
      // default value
      dataSrc.params.map((param: any) => {
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
      const dstNodes = newDstNodes(dstNodeIds, dstNodesPositionAndSize, dstProps);
      // データソースの出力ノードをフロー入力Portに設定する
      dstNodes.forEach(dstNode => {
        const port = {
          label: dstNode.label,
          nodeId: dstNode.id,
          type: dstNode.type
        };
        newState.flow!.flow.ports[0].upsert(port);
      });

      let nodes: any[] = newState.flow!.flow.nodes;
      nodes.push(newNode);
      dstNodes.forEach((dstNode) => {
        nodes.push(dstNode);
      })
      newState.flow!.flow.nodes = [...nodes];
      newState.nodes = [...nodes]
      addToGraph(graph, newNode);
      newState.graph = graph.getGraph(newState.nodes, action.zoom);
    };
      break;

    case ADD_DATADST_ACTION: {
      const { dataDest, selctedDataNodeId } = action.payload;

      let srcNodeIds = [selctedDataNodeId];

      const id = newNodeId('o', newState.flow!.flow.nodes, 1)[0];

      const { newNodePositionAndSize } = newNodesPositionAndSize(graph, newState.flow!.flow.nodes, srcNodeIds, []);

      const srcNodes = newState.flow!.flow.nodes.filter(
        node => srcNodeIds.includes(node.id)
      );

      // データデストの入力ノードをフロー出力Portに設定する
      srcNodes.forEach(srcNode => {
        const port = {
          label: srcNode.label,
          nodeId: srcNode.id,
          type: srcNode.type
        };
        newState.flow!.flow.ports[1].upsert(port);
      });

      let args = {};
      // default value
      dataDest.params.map((param: any) => {
        // default値の適用
        if (param.default) args[param.name] = param.default;
      });

      // new dataDest
      const props = {
        id: id,
        label: dataDest.label,
        position: newNodePositionAndSize.position,
        size: newNodePositionAndSize.size,
        dataDest: dataDest,
        srcNodeIds: srcNodeIds,
        args: args,
      }

      const newNode = newDataDest(props);
      let nodes: any[] = newState.flow!.flow.nodes;
      nodes.push(newNode);
      newState.flow!.flow.nodes = [...nodes];
      newState.nodes = [...nodes]
      // graph
      addToGraph(graph, newNode);
      newState.graph = graph.getGraph(newState.nodes, action.zoom);
    };
      break;

    default:
      (window as any).nodes = state.nodes;
      return state;
  }

  (window as any).nodes = newState.nodes;
  return newState;

};

/**
 * エッジのつなぎ直し処理
 * @param newState
 * @param action action.stepに変更後のコマンドステップ or サブフローステップを設定する
 * @returns {*}
 */
const rebuildNodesEdges = (newState, action) => {
  return newState.nodes.map((node: any, index) => {
    //入力選択機能やクリップボードのコピーによって再度 結びつきが変更された場合のエッジのつなぎ直し対応
    if (node.id === action.step.id) {
      if (node instanceof CommandStepModel ||
        node instanceof SubFlowStepModel ||
        node.classification === "data_source" ||
        node.classification === "data_dest") {
        if (!_.isEqual(node.srcs, action.step.srcs)) {
          //ノードのつながりを削除
          Object.keys(node.srcs).forEach(portLabel => {
            const id = node.srcs[portLabel];
            const from = id;
            const to = node.id;
            if (GraphUtil.getNode(newState.nodes, id)) {
              graph.removeEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
            }
          });
          //ノードのつながりを再構築
          Object.keys(action.step.srcs).forEach(portLabel => {
            const id = action.step.srcs[portLabel];
            const from = id;
            const to = action.step.id;
            if (GraphUtil.getNode(newState.nodes, id)) {
              graph.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
            }
          });
        }
        if (!_.isEqual(node.dsts, action.step.dsts)) {
          //ノードのつながりを削除
          Object.keys(node.dsts).forEach(portLabel => {
            const id = node.dsts[portLabel];
            const from = node.id;
            const to = id;
            if (GraphUtil.getNode(newState.nodes, id)) {
              graph.removeEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
            }
          });
          //ノードのつながりを再構築
          Object.keys(action.step.dsts).forEach(portLabel => {
            const id = action.step.dsts[portLabel];
            const from = action.step.id;
            const to = id;
            if (GraphUtil.getNode(newState.nodes, id)) {
              graph.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
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
const allRebuildNodesEdges = (newState) => {
  //入力選択機能やクリップボードのコピーによって再度 結びつきが変更された場合のエッジのつなぎ直し対応
  graph.removeAllEdges(newState.graph.edges);
  return newState.nodes.map((node, index) => {
    if (node instanceof CommandStepModel ||
        node instanceof SubFlowStepModel ||
        node instanceof DataSrcStepModel ||
        node instanceof DataDstStepModel) {
      // 入力Edgeを再生成する
      Object.keys(node.srcs).forEach(portLabel => {
        const id = node.srcs[portLabel];
        const from = id;
        const to = node.id;
        if (GraphUtil.getNode(newState.nodes, id)) {
          graph.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
        }
      });
      // 出力Edgeを再生成する
      Object.keys(node.dsts).forEach(portLabel => {
        const id = node.dsts[portLabel];
        const from = node.id;
        const to = id;
        if (GraphUtil.getNode(newState.nodes, id)) {
          graph.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
        }
      });
    }
    return node;
  });
};

export function newNodeId(prefix: string, nodes: any[], count: number = 1) {
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


function getNotOverlapNodePosition(nodes: any[], position: { x: number, y: number },) {
  const { x, y } = position;
  let result = { x: x, y: y }
  const threshold = 3
  nodes.forEach((node) => {
    //座標位置に対して前後 3pxの範囲で重複する場合のみ再度位置調整をする
    if (parseInt(node.position.x) >= x - threshold &&
      parseInt(node.position.x) <= y + threshold &&
      parseInt(node.position.y) >= y - threshold &&
      parseInt(node.position.y) <= y + threshold) {
      //合致していた場合新しい座標を計算
      result = getNotOverlapNodePosition(nodes, { x: x + 10, y: y + 10 });
    }
  })
  return result
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

function newNodesPositionAndSize(graph: GraphUtil, nodes: any[], srcNodeIds: string[] = [], dstNodeIds: string[] = []) {
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
  const notOverlapNodePosition = getNotOverlapNodePosition(nodes, result.newNodePositionAndSize.position);
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


function newDstNodes(dstNodeIds: string[], dstNodesPositionAndSize: Object, props: any) {
  let result: any[] = [];

  dstNodeIds.forEach((key: string, index) => {
    props.id = dstNodeIds[index];
    props.label = key;
    props.size = dstNodesPositionAndSize[key].size;
    props.position = dstNodesPositionAndSize[key].position;

    const newDstNode = new DataFrameStepModel(props);
    result.push(newDstNode);
  })

  return result;
}

function addToGraph(graph: GraphUtil, node: any) {
  // node
  graph.addNode(node.id);
  // src edges
  Object.keys(node.srcs).forEach((key) => {
    const from = node.srcs[key];
    const to = node.id;
    const portLabel = key;
    graph.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
  })
  // dst edges
  Object.keys(node.dsts).forEach((key) => {
    const to = node.dsts[key];
    const from = node.id;
    const portLabel = key;
    graph.addEdge(from, to, GraphUtil.edgeName(from, to, portLabel));
    graph.addNode(to);
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

  let dataSrcProps = {
    label: dataSrc.label,
    classification: dataSrc.classification,
    flow: dataSrc.flow,
    id: id,
    type: Constants.step.type.subflow,
    position: position,
    srcs: {},
    dsts: dsts,
    size: size,
    args: args,
  }

  return new DataSrcStepModel(dataSrcProps);
}

export type DataDestProps = {
  id: string
  label: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  srcNodeIds: string[]
  dataDest: any
  args: {}
}

export function newDataDest(props: DataDestProps) {
  const { id, label, position, size, srcNodeIds, dataDest, args } = props;

  let srcs = {};
  const inPorts: any[] = dataDest.ports[0];
  inPorts.forEach((inPort, index) => {
    srcs[inPort.label] = srcNodeIds[index];
  });

  let DataDstProps = {
    flow: dataDest.flow,
    label: dataDest.label,
    classification: dataDest.classification,
    id: id,
    type: Constants.step.type.subflow,
    position: position,
    srcs: srcs,
    dsts: {},
    size: size,
    args: args
  }

  return new DataDstStepModel(DataDstProps);
}

/**
 * ステップの追加
 * @param step
 * @returns {{type: string, step: *}}
 */
export const addStepAction = (add_step:StepModelType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => {
  return {
    type: ADD_STEP_ACTION,
    add_step: add_step,
    src_step_ids: src_step_ids,
    dst_step_ids: dst_step_ids,
    zoom: zoom
  };
};

/**
 * JSONの読み込み
 * @param context
 * @returns {{type: string, context: *}}
 */
export function loadFlowJSONAction(context: {}, zoom:number) {
  return {
    type: LOAD_FLOW_JSON_ACTION,
    context: context,
    zoom: zoom
  };
}

/**
 * コマンド一覧などマスターの読み込み
 * @param context
 * @returns {{type: string, context: *}}
 */
// export const addMasterAction = (context: {}) => {
//   return {
//     type: ADD_MASTER_ACTION,
//     context: context
//   };
// };

/**
 * ステップの更新
 * @param step
 * @returns {{type: string, step: *}}
 */
export const updateStepAction = (step: StepModelType, zoom:number) => {
  return {
    type: UPDATE_STEP_ACTION,
    step: step,
    zoom: zoom
  };
};

/**
 * フローの更新
 * @param flow
 * @returns {{type: string, flow: *}}
 */
export const updateFlowAction = flow => {
  return {
    type: UPDATE_FLOW_ACTION,
    flow: flow
  };
};

/**
 * ステップの削除
 * @param step_ids
 * @returns {{type: string, step: *}}
 */
export const deleteStepsAction = (step_ids:string[], zoom:number) => {
  return {
    type: DELETE_STEPS_ACTION,
    step_ids: step_ids,
    zoom: zoom
  };
};

/**
 * ステップのカット
 * @param step_ids
 * @returns {{type: string, step: *}}
 */
export const cutStepsAction = (step_ids: []) => {
  return {
    type: CUT_STEPS_ACTION,
    step_ids: step_ids
  };
};
/**
 * ステップのコピー
 * @param step_ids
 * @returns {{type: string, step: *}}
 */
export const copyStepsAction = (step_ids: string[]) => {
  return {
    type: COPY_STEPS_ACTION,
    step_ids: step_ids
  };
};
/**
 * ステップのペースト
 * @returns {{type: string, step: *}}
 */
export const pasteStepsAction = (paste_nodes: [], zoom:number) => {
  return {
    type: PASTE_STEPS_ACTION,
    paste_nodes: paste_nodes,
    zoom: zoom
  };
};
/**
 * 履歴の追加
 * @returns {{type: string, step: *}}
 */
export const addHistoryAction = () => {
  return {
    type: ADD_HISTORY_ACTION
  };
};
/**
 * アンドゥ
 * @returns {{type: string, step: *}}
 */
export const undoAction = (zoom:number) => {
  return {
    type: UNDO_ACTION,
    zoom: zoom
  };
};
/**
 * リドゥ
 * @returns {{type: string, step: *}}
 */
export const redoAction = (zoom:number) => {
  return {
    type: REDO_ACTION,
    zoom: zoom
  };
};
/**
 * ステップの選択
 * @param selected_steps
 * @returns {{type: string, selected_steps: *}}
 */
// export const selectStepsAction = (selected_steps: any[]) => {
//   return {
//     type: SELECT_STEPS_ACTION,
//     selected_steps: selected_steps
//   };
// };

// export const addSelectStepAction = (selected_step_id: string) => {
//   return {
//     type: ADD_SELECT_STEP_ACTION,
//     selected_step_id: selected_step_id
//   };
// };

// export const deleteSelectStepAction = (selected_step_id: string) => {
//   return {
//     type: DELETE_SELECT_STEP_ACTION,
//     selected_step_id: selected_step_id
//   };
// };

export const deleteCacheAction = (selected_step_id: string) => {
  return {
    type: DELETE_CACHE_ACTION,
    selected_step_id: selected_step_id
  };
};

/**
 * フローの実行
 * @param flowid
 * @returns {{type: string, step: *}}
 */
// export const executeFlowAction = (flowid: string) => {
//   return {
//     type: EXECUTE_FLOW_ACTION
//   };
// };

/**
 * ステップの選択
 * @param selected_steps
 * @returns {{type: string, selected_steps: *}}
 */
export const sortFlowAction = (zoom:number) => {
  return {
    type: SORT_FLOW_ACTION,
    zoom: zoom
  };
};

export const dragStartAction = (x: number, y: number) => {
  return {
    type: DRAG_START_ACTION,
    x: x,
    y: y
  };
};

export const draggingAction = (x: number, y: number) => {
  return {
    type: DRAGGING_ACTION,
    x: x,
    y: y
  };
};

// export const dragEndAction = (x: number, y: number) => {
//   return {
//     type: DRAG_END_ACTION,
//     x: x,
//     y: y
//   };
// };

/**
 * ズーム設定
 * @param offset 差分
 * @param value 固定値
 * @returns {{type: string, offset: *, value: *}}
 * @constructor
 */
export const setZoomAction = (zoom:number) => {
  return {
    type: SET_ZOOM_ACTION,
    zoom: zoom,
  };
};

/**
 * データフレームの詳細更新
 * @param dataFrame
 * @returns {{dataFrame: DataFrameStepModel, type: string}}
 */
// export const updateDataFrameDetailAction = (detail: FrameType) => {
//   return {
//     detail: detail,
//     type: UPDATE_DATA_SOURCE_DETAIL_ACTION
//   };
// };

export const addNoteAction = (x: number, y: number) => {
  return {
    type: ADD_NOTE_ACTION,
    x: x,
    y: y
  };
};

// export const sortStepSrcEndAction = (detail: any, mouseEvent: {}) => {
//   return {
//     type: SORT_STEP_SRC_END_ACTION,
//     payload: {
//       oldIndex: detail.oldIndex,
//       newIndex: detail.newIndex
//     }
//   };
// };

export const moveStepsAction = (x: number, y: number, step:any, selectedStepIds:string[], zoom:number) => {
  return {
    type: MOVE_STEPS_ACTION,
    x: x,
    y: y,
    step: step,
    selectedStepIds: selectedStepIds,
    zoom: zoom
  };
};

// export const resizeInspectorAction = (width: number) => {
//   return {
//     type: RESIZE_INSPECTOR_ACTION,
//     width: width
//   };
// };

// export const refreshCanvasSizeAction = () => {
//   return {
//     type: REFRESH_CANVAS_SIZE_ACTION
//   };
// };

// export const setExecuteModeAction = (executeMode: FlowExecuteModeValue) => {
//   return {
//     type: SET_EXECUTE_MODE_ACTION,
//     executeMode: executeMode
//   };
// };

// export const setEditModeAction = (editMode: FlowEditModeValue) => {
//   return {
//     type: SET_EDIT_MODE_ACTION,
//     editMode: editMode
//   };
// };

// export const setNetworkStatusAction = (status: NetworkStatusValue) => {
//   return {
//     type: SET_NETWORK_STATUS,
//     status: status
//   };
// };

export const refreshFlowAction = (context: {}, zoom:number) => {
  return {
    type: REFRESH_FLOW_ACTION,
    context: context,
    zoom: zoom
  };
};

export const updateLastSavedFlowAction = () => {
  return {
    type: UPDATE_LAST_SAVED_FLOW_ACTION
  }
}

export const addDataSrcStepAction = (dataSrc: any, zoom:number) => {
  return {
    type: ADD_DATASRC_ACTION,
    payload: {
      dataSrc: dataSrc
    },
    zoom: zoom
  }
}

export const addDataDstStepAction = (dataDst: any, selectedDataNodeId: string, zoom:number) => {
  return {
    type: ADD_DATADST_ACTION,
    payload: {
      dataDest: dataDst,
      selctedDataNodeId: selectedDataNodeId,
    },
    zoom: zoom
  }
}
