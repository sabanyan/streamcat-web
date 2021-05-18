import Constants from "Constants/index";
import { Allowlist } from "Types/index";
import Graph from "Modules/graph/index";

import { createReducer, PayloadAction, createAction, createEntityAdapter } from '@reduxjs/toolkit'
import _ from "lodash";

export const LOAD_EDITOR = createAction('INIT_FLOW_EDITOR');

export const ADD_NOTE = createAction('ADD_NOTE');
export const ADD_DATAFRAME = createAction('ADD_DATA_FRAME');
export const ADD_DATASOURCE = createAction('ADD_DATA_SOURCE');
export const ADD_DATADEST = createAction('ADD_DATA_DEST');
export const ADD_SHAREDFLOW = createAction('ADD_SHAREDFLOW');
export const ADD_COMMAND = createAction('ADD_COMMAND');

export const UPDATE_NODE = createAction('UPDATE_NODE');
export const UPDATE_FLOW = createAction('UPDATE_FLOW');

export const DELETE_NODES = createAction('DELETE_NODE');

export const SORT_FLOW = createAction('SORT_FLOW_ACTION');
export const SORT_STEP_SRCS_END = createAction('SORT_STEP_SRC_END');

export const DRAG_START = createAction('DRAG_START');
export const DRAGGING = createAction('DRAGGING');
export const DRAG_END = createAction('DRAG_END');

type FlowState = {
  label: string
  nodes: any[]
  ports: [
    any[], // in
    any[]  // out
  ]
  params: any[]
  creater: string
  createdAt: string,
  description: string
}

export type FlowEditorState = {
  flow: FlowState,
  mast: { //　コマンドの定義
    commands: any[],
    sharedFlows: any[],
    dataSources: any[],
    dataDests: any[],
  },
  allowlist: Allowlist,
  zoom: number,
  selectedNodeIds: string[],
  drag: {
    start: {
      x: number,
      y: number
    },
    end: {
      x: number,
      y: number
    }
  } | {},
  graph: {
    nodes: any[],
    edges: any[],
    width: number,
    height: number
  }
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

const graph: Graph = new Graph();

const initialState: FlowEditorState = {
  flow: {
    label: "",
    nodes: [],
    ports: [
      [], // in
      []  // out
    ],
    params: [],
    creater: "",
    createdAt: "",
    description: ""
  },
  mast: {
    commands: [],
    sharedFlows: [],
    dataSources: [],
    dataDests: []
  },
  allowlist: {
    copy: false,
    createFile: false,
    createFolder: false,
    createProject: false,
    delete: false,
    download: false,
    execute: false,
    findMember: false,
    lock: false,
    move: false,
    read: false,
    update: false,
    updateMember: false,
    upload: false,
    export: false,
    import: false,
  },
  zoom: 100,
  selectedNodeIds: [],
  drag: {},
  graph: {
    nodes: [],
    edges: [],
    width: 0,
    height: 0
  }
}

export const flowEditorReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(LOAD_EDITOR, (state, action: PayloadAction<any>) => {
      const { flow, allowlist, zoom, mast } = action.payload;

      state = initialState;
      state.flow = flow;
      state.allowlist = allowlist;
      state.zoom = zoom;
      state.mast = mast;

      // position、sizeが設定されてない場合
      const hasPosition = state.flow.nodes.filter((node) => !(node.position) || !(node.size)).length > 0 ? false : true;
      if (!hasPosition) state.flow.nodes = graph.refreshPosition(state.flow.nodes);

      // graphの設定
      state.graph = loadGraph(graph, state.flow.nodes);

      // zooming Graph
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(ADD_NOTE, (state, action: PayloadAction<any>) => {
      const { } = action.payload;
      const id = newNodeId('n', state.flow.nodes, 1)[0];
      const positionAndSize = defaultNodePositionAndSize();
      const props = {
        id: id,
        label: "新しいメモ",
        content: "",
        size: positionAndSize.size,
        position: positionAndSize.position,
        fontSize: Constants.default.note.fontSize.default,
        color: Constants.default.note.color.green
      }
      const newNode = newNote(props);
      state.flow.nodes.push(newNode);
      // graph
      graph.addNode(newNode.id);
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(ADD_DATAFRAME, (state, action: PayloadAction<any>) => {
      const { label, uuid } = action.payload;
      const id = newNodeId('d', state.flow.nodes, 1)[0];
      const positionAndSize = defaultNodePositionAndSize();
      const props = {
        id: id,
        label: label,
        size: positionAndSize.size,
        position: positionAndSize.position,
        uuid: uuid,
        visiblePort: true
      }
      const newNode = newDataFrame(props);
      state.flow.nodes.push(newNode);
      // graph
      graph.addNode(newNode.id);
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(ADD_SHAREDFLOW, (state, action: PayloadAction<any>) => {
      const { label, sharedFlow, srcNodeIds, uuid, args } = action.payload;
      const id = newNodeId('f', state.flow.nodes, 1)[0];
      const outPorts = sharedFlow.ports[1];

      const dstNodeIds = newNodeId('d', state.flow.nodes, outPorts.length);
      const { newNodePositionAndSize, dstNodesPositionAndSize } = newNodesPositionAndSize(graph, state.selectedNodeIds, srcNodeIds, dstNodeIds);

      // new sharedFlow
      const props = {
        id: id,
        label: label,
        position: newNodePositionAndSize.position,
        size: newNodePositionAndSize.size,
        sharedFlow: sharedFlow,
        dstNodeIds: dstNodeIds,
        srcNodeIds: srcNodeIds,
        uuid: uuid,
        args: args,
      }

      let dstProps = {
        id: "temp",
        label: "temp",
        position: newNodePositionAndSize.position,
        size: newNodePositionAndSize.size,
        uuid: null,
        visiblePort: true
      }

      const newNode = newSharedFlow(props);
      const dstNodes = newDstNodes(dstNodeIds, dstNodesPositionAndSize, dstProps);

      state.flow.nodes.push(newNode);
      state.flow.nodes.push(dstNodes);

      // graph
      addToGraph(graph, newNode);

      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(ADD_COMMAND, (state, action: PayloadAction<any>) => {
      const { label, command, srcNodeIds, uuid } = action.payload;
      const id = newNodeId('f', state.flow.nodes, 1)[0];
      const outPorts: any[] = command.ports[1];

      const dstNodeIds = newNodeId('d', state.flow.nodes, outPorts.length);
      const { newNodePositionAndSize, dstNodesPositionAndSize } = newNodesPositionAndSize(graph, state.selectedNodeIds, srcNodeIds, dstNodeIds);

      // default value
      let args = {};
      command.params.map((param: any) => {
        // default値の適用
        if (param.default) args[param.name] = param.default;
      });
      // new command
      const props = {
        id: id,
        label: label,
        position: newNodePositionAndSize.position,
        size: newNodePositionAndSize.size,
        command: command,
        dstNodeIds: dstNodeIds,
        srcNodeIds: srcNodeIds,
        uuid: uuid,
        args: args,
      }

      let dstProps = {
        id: "temp",
        label: "temp",
        position: newNodePositionAndSize.position,
        size: newNodePositionAndSize.size,
        uuid: null,
        visiblePort: true
      }

      const newNode = newCommand(props);
      const dstNodes = newDstNodes(dstNodeIds, dstNodesPositionAndSize, dstProps);

      state.flow.nodes.push(newNode);
      state.flow.nodes.push(dstNodes);

      // graph
      addToGraph(graph, newNode);
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(ADD_DATASOURCE, (state, action: PayloadAction<any>) => {
      const { label, dataSource, uuid } = action.payload;
      const id = newNodeId('i', state.flow.nodes, 1)[0];

      const outPorts: any[] = dataSource.ports[1];

      const dstNodeIds = newNodeId('d', state.flow.nodes, outPorts.length);
      const { newNodePositionAndSize, dstNodesPositionAndSize } = newNodesPositionAndSize(graph, state.selectedNodeIds, [], dstNodeIds);

      // default value
      let args = {};
      dataSource.params.map((param: any) => {
        // default値の適用
        if (param.default) args[param.name] = param.default;
      });

      // new dataSource
      const props = {
        id: id,
        label: label,
        position: newNodePositionAndSize.position,
        size: newNodePositionAndSize.size,
        dataSource: dataSource,
        dstNodeIds: dstNodeIds,
        uuid: uuid,
        args: args,
      }

      let dstProps = {
        id: "temp",
        label: "temp",
        position: newNodePositionAndSize.position,
        size: newNodePositionAndSize.size,
        uuid: null,
        visiblePort: true,
        port: {
          in: true,
          out: false
        }
      }

      const newNode = newDataSource(props);
      const dstNodes = newDstNodes(dstNodeIds, dstNodesPositionAndSize, dstProps);

      state.flow.nodes.push(newNode);
      state.flow.nodes.push(dstNodes);

      // graph
      addToGraph(graph, newNode);
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(ADD_DATADEST, (state, action: PayloadAction<any>) => {
      const { label, dataDest, uuid, srcNodeIds, targetDataNode } = action.payload;

      state.flow.nodes = state.flow.nodes.map((node) => {
        if (node.id === targetDataNode.id) {
          targetDataNode.visiblePort = false;
          targetDataNode.port = {
            in: false,
            out: true
          }

        }
        return node;
      })

      const id = newNodeId('o', state.flow.nodes, 1)[0];

      const { newNodePositionAndSize } = newNodesPositionAndSize(graph, state.selectedNodeIds, srcNodeIds, []);

      Array(srcNodeIds).forEach((srcNodeId) => {
        state.flow.nodes = state.flow.nodes.map((node) => {
          if (node.id === srcNodeId && Constants.step.type.frame) {
            node.port.out = true;
          }
        })
      })

      // default value
      let args = {};
      dataDest.params.map((param: any) => {
        // default値の適用
        if (param.default) args[param.name] = param.default;
      });

      // new dataDest
      const props = {
        id: id,
        label: label,
        position: newNodePositionAndSize.position,
        size: newNodePositionAndSize.size,
        dataDest: dataDest,
        srcNodeIds: srcNodeIds,
        uuid: uuid,
        args: args,
      }

      const newNode = newDataDest(props);

      state.flow.nodes.push(newNode);

      // graph
      addToGraph(graph, newNode);
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })

    .addCase(UPDATE_NODE, (state, action: PayloadAction<any>) => {
      const { updatedNode } = action.payload;

      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(UPDATE_FLOW, (state, action: PayloadAction<any>) => {
      const { flow } = action.payload;
      state.flow = flow;
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(DELETE_NODES, (state, action: PayloadAction<any>) => {
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(SORT_FLOW, (state, action: PayloadAction<any>) => {
      let targets = state.flow.nodes.filter((node) => {
        return !(node.type === Constants.step.type.note);
      });
      graph.refreshPosition(targets); //ノード位置を再計算
      state.graph = zoomedGraph(graph, state.flow.nodes, state.zoom);
    })
    .addCase(SORT_STEP_SRCS_END, (state, action: PayloadAction<any>) => {
      const { oldIndex, newIndex } = action.payload;
      state.flow.nodes.forEach((node: any) => {
        if (node.id == state.selectedNodeIds[0]) {
          // todo
        }
      })
    })
    .addCase(DRAG_START, (state, action: PayloadAction<any>) => {
      const { x, y } = action.payload;
      state = {
        ...state,
        drag: {
          start: {
            x: x,
            y: y
          },
          end: {
            x: x,
            y: y
          }
        },
        graph: {
          ...state.graph,
          width: (x > state.graph.width) ? x : state.graph.width,
          height: (y > state.graph.height) ? y : state.graph.height
        }
      };

    })
    .addCase(DRAGGING, (state, action: PayloadAction<any>) => {
      const { x, y } = action.payload;
      state = {
        ...state,
        drag: {
          ...state.drag,
          end: {
            x: x,
            y: y
          }
        },
        graph: {
          ...state.graph,
          width: (x > state.graph.width) ? x : state.graph.width,
          height: (y > state.graph.height) ? y : state.graph.height
        }
      };
    })
    .addCase(DRAG_END, (state, action: PayloadAction<any>) => {
      state.drag = {};
    })
});


function loadGraph(graph: Graph, nodes: any[]) {
  nodes.forEach((node: any) => {
    graph.addNode(node.id);
    const hasSrcs = (Object.keys(node.srcs).length);
    const hasDsts = (Object.keys(node.dsts).length);

    if (hasSrcs) {
      Object.keys(node.srcs).forEach((portName) => {
        const src = node.srcs[portName]
        const from = src
        const to = node.id
        const label = graph.edgeName(from, to, portName)//src
        graph.addEdge(from, to, label)
      })
    }

    if (hasDsts) {
      Object.keys(node.dsts).forEach((portName) => {
        const dst = node.dsts[portName]
        const from = node.id
        const to = dst
        const label = graph.edgeName(from, to, portName)//dst
        graph.addEdge(from, to, label)
      })
    }
  });

  return graph.getGraph(nodes);
}

function zoom(value: number, zoom: number) {
  const ratio = zoom / 100;
  return value * ratio;
}

function zoomReverse(value: number, zoom: number) {
  const ratio = 100 / zoom;
  return value * ratio;
}

function zoomedGraph(graph: Graph, nodes: any[], zoomValue) {
  let result = graph.getGraph(nodes);
  result.width = zoom(result.width, zoomValue);
  result.height = zoom(result.height, zoomValue);

  return result;
}

function addToGraph(graph: Graph, node: any) {
  // node
  graph.addNode(node.id);
  // src edges
  Object.keys(node.srcs).forEach((key) => {
    const from = node.srcs[key];
    const to = node.id;
    const portName = key;
    graph.addEdge(from, to, graph.edgeName(from, to, portName));
  })
  // dst edges
  Object.keys(node.dsts).forEach((key) => {
    const to = node.srcs[key];
    const from = node.id;
    const portName = key;
    graph.addEdge(from, to, graph.edgeName(from, to, portName));
    graph.addNode(to);
  })
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

function newNodesPositionAndSize(graph: Graph, nodes: any[], srcNodeIds: string[] = [], dstNodeIds: string[] = []) {
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
      const node = graph.getNode(nodes, id);
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
      result.dstNodesPositionAndSize[dstNodeId].position.x = result.newNodePositionAndSize.position.x - average.dx + index * (Constants.default.node.width + Constants.default.graph.nodeSeparator + notOverlapOffsetX);
      result.dstNodesPositionAndSize[dstNodeId].position.y = Constants.default.node.height + Constants.default.graph.rankSeparator;
      result.dstNodesPositionAndSize[dstNodeId].size.width = Constants.default.node.width;
      result.dstNodesPositionAndSize[dstNodeId].size.height = Constants.default.node.height;
    })
  }

  return result;
}

function newNodeId(prefix: string, nodes: any[], count: number = 1) {
  let id: string = prefix;
  let idNumber: string = "";
  let result: string[] = [];

  let temp = prefix + idNumber;
  let index = 0;
  while (index < nodes.length && count > 0) {
    const found = nodes.find((node) => {
      return (node.id === temp)
    })
    if (!found) {
      result.push(temp);
      count = count - 1;
    }

    temp = String(prefix + index + 1);
    index = index - 1;
  }

  return result;
}

function newDstNodes(dstNodeIds: Object, dstNodesPositionAndSize: Object, props: DataFrameProps) {
  let result: any[] = [];

  Object.keys(dstNodeIds).forEach((key: string) => {
    props.id = dstNodeIds[key];
    props.label = key;
    props.size = dstNodesPositionAndSize[key].size;
    props.position = dstNodesPositionAndSize[key].position;

    const newDstNode = newDataFrame(props);
    result.push(newDstNode);
  })

  return result;
}

export type NoteProps = {
  id: string
  label: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  content: string
  fontSize: number
  color: string
}

export function newNote(props: NoteProps) {
  const { id, label, position, size, content, fontSize, color } = props;

  return {
    id: id,
    label: label,
    position: position,
    size: size,
    content: content,
    fontSize: fontSize,
    color: color,

    type: Constants.step.type.note
  }
}

export type DataFrameProps = {
  id: string
  label: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  uuid: string | null
  visiblePort: boolean
  port?: {
    in: boolean,
    out: boolean
  }
}

export function newDataFrame(props: DataFrameProps) {

  const { id, label, position, size, uuid, visiblePort, port } = props;

  return {
    id: id,
    label: label,
    position: position,
    size: size,
    uuid: uuid,　// データソースのUUID

    type: Constants.step.type.frame,
    makeCache: false,
    visiblePort: visiblePort,
    port: port ? port : null
  }
}

export type SharedFlowProps = {
  id: string,
  label: string,
  position: { x: number, y: number },
  size: { width: number, height: number },
  sharedFlow: FlowState,
  srcNodeIds: string[],
  dstNodeIds: string[],
  uuid: string | null,
  args: {}
}

export function newSharedFlow(props: SharedFlowProps) {

  const { id, label, position, size, srcNodeIds, dstNodeIds, uuid, args, sharedFlow } = props;
  const inPorts = sharedFlow.ports[0];
  const outPorts = sharedFlow.ports[1];

  let srcs = {};
  srcNodeIds.forEach((id, index) => {
    let portName = inPorts[index].nodeId;
    srcs[portName] = id;
  });

  let dsts = {};
  dstNodeIds.forEach((id, index) => {
    let portName = outPorts[index].nodeId;
    dsts[portName] = id;
  });

  return {
    id: id,
    label: label,
    position: position,
    srcs: srcs,
    dsts: dsts,
    size: size,
    uuid: uuid, // 共有フローのUUID
    args: args,
    type: Constants.step.type.sharedFlow
  }
}

export type CommandProps = {
  id: string
  label: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  command: any
  srcNodeIds: string[]
  dstNodeIds: string[]
  uuid: string | null
  args: {}
}

export function newCommand(props: CommandProps) {
  const { id, label, position, size, srcNodeIds, dstNodeIds, command, uuid, args } = props;

  const inPorts = command.ports[0];
  const outPorts = command.ports[1];

  const isInPortsAddable = (inPorts[0] && inPorts[0].name === '*') ? true : false;

  let srcs = {};
  srcNodeIds.forEach((id, index) => {
    let portName = isInPortsAddable ? "*" + index : inPorts[index].name;
    srcs[portName] = id;
  });

  let dsts = {};
  dstNodeIds.forEach((id, index) => {
    let portName = outPorts[index].name;
    dsts[portName] = id;
  });

  return {
    id: id,
    label: label,
    position: position,
    srcs: srcs,
    dsts: dsts,
    size: size,
    uuid: uuid, // 共有フローのUUID
    args: args,

    type: Constants.step.type.command
  }
}
export type DataSourceProps = {
  id: string
  label: string
  position: { x: number, y: number }
  size: { width: number, height: number }
  dstNodeIds: string[]
  dataSource: any
  args: {}
}

export function newDataSource(props: DataSourceProps) {
  const { id, label, position, size, dstNodeIds, dataSource, args } = props;

  let dsts = {};
  const outPorts: any[] = dataSource.ports[1];
  outPorts.forEach((outPort, index) => {
    dsts[outPort.label] = dstNodeIds[index];
  });

  return {
    id: id,
    label: label,
    position: position,
    srcs: {},
    dsts: dsts,
    size: size,
    dataSource: dataSource,
    args: args
  }
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
  const inPorts: any[] = dataDest.ports[1];
  inPorts.forEach((inPort, index) => {
    srcs[inPort.label] = srcNodeIds[index];
  });

  return {
    id: id,
    label: label,
    position: position,
    srcs: srcs,
    size: size,
    dataSource: dataDest,
    args: args
  }
}