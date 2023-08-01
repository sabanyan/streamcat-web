//@flow
import dagre from 'dagre'
import Constants from 'Constants/index'
import { CommandStepModel, DataFrameStepModel, SubFlowStepModel, DataDstStepModel, DataSrcStepModel } from 'Model/index'
import { FlowUtil, ZoomUtil } from 'Utils/index'
import { State } from 'Modules/flowEditor'
import { CommandNodeType, FrameNodeType, NoteNodeType, calcSize } from 'Model/Step/NodeTypes'
import { Flow } from 'Model/Library'

export const defaultNodeProps = {
  width: Constants.default.node.width,
  height: Constants.default.node.height,
}

export const defaultGraphProps = {
  nodeSeparator: Constants.default.graph.nodeSeparator,
  edgeSeparator: 0,
  marginX: 80,
  marginY: 100,
  rankSeparator: Constants.default.graph.rankSeparator,
}

class GraphUtil {
  g: any

  constructor() {
    this.g = new dagre.graphlib.Graph({ multigraph: true })
    this.g.setGraph({
      marginx: defaultGraphProps.marginX,
      marginy: defaultGraphProps.marginY,
      nodesep: defaultGraphProps.nodeSeparator,
      edgesep: defaultGraphProps.edgeSeparator,
      ranksep: defaultGraphProps.rankSeparator
    })
    this.g.setDefaultEdgeLabel(function () {
      return {
        labelpos: 'l',
      }
    })
  }

  /**
   * ノードの追加
   * @param id
   * @param from_id
   */
  addNode(id: string) {
    const self = this
    this.g.setNode(id, {
      label: id,
      width: defaultNodeProps.width,
      height: defaultNodeProps.height,
    })
    // if (Array.isArray(from_id)) {
    //   from_id.forEach((fid) => {
    //     self.addEdge(fid, id,GraphUtil.edgeName(fid,id))
    //   })
    // }
    // else if (from_id) {
    //   this.addEdge(from_id, id,GraphUtil.edgeName(from_id,id))
    // }
  }

  outEdges(id: string) {
    return this.g.outEdges(id)
  }

  inEdges(id: string) {
    return this.g.inEdges(id)
  }

  nodeEdges(id: string) {
    return this.g.nodeEdges(id)
  }

  static edgeName(v: string, w: string, port_name: string) {
    return JSON.stringify({ v: v, w: w, port_name: port_name })
  }

  /**
   * ノードの削除
   * @param id
   */
  removeNode(nodes: any[], id: string): any[] {
    const edges = this.g.nodeEdges(id)
    if (Array.isArray(edges)) {
      edges.forEach((edge) => {
        this.g.removeEdge(edge)
      })
    }
    this.g.removeNode(id)
    return FlowUtil.removeNodeId(nodes, [id])
  }

  /**
   * エッジの追加
   * @param from_id
   * @param to_id
   */
  addEdge(from_id: string, to_id: string, name: string) {
    this.g.setEdge({ v: from_id, w: to_id, name: name })
  }

  /**
   * エッジの削除
   * @param from_id
   * @param to_id
   */
  removeEdge(from_id: string, to_id: string, name: string) {
    this.g.removeEdge({ v: from_id, w: to_id, name: name })
  }

  /**
   * 全エッジの削除
   * @param edges
   */
  removeAllEdges(edges: any[]) {
    edges.forEach((edge) => {
      const from = edge.v
      const to = edge.w
      const portLabel = edge.name
      this.removeEdge(from, to, portLabel)
    })
  }

  /**
   * dagreによるレイアウト
   */
  layout() {
    dagre.layout(this.g)
  }

  /**
   * グラフサイズの取得
   * @returns {{width, height}}
   */

  getGraph(nodes:(CommandNodeType | FrameNodeType)[], zoom:number) {
    const graph = this.g.graph()
    const graph_nodes = this.g.nodes()
    const edges = this.g.edges()
    if (nodes) {
      const width = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.x + nodes[key].size.width))
      const height = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.y + nodes[key].size.height))
      return { width: ZoomUtil.zoom(width, zoom), height: ZoomUtil.zoom(height, zoom), nodes: graph_nodes, edges: edges }
    }

    return {
      width: ZoomUtil.zoom(graph.width, zoom),
      height: ZoomUtil.zoom(graph.height, zoom),
      nodes: graph_nodes,
      edges: edges
    }
  }

  /**
   * 各ノードとエッジの関係から計算された位置をstepに設定する
   * @param nodes
   * @returns {*}
   */
  refreshPosition(nodes: any[]) {
    const self = this
    this.layout()
    this.g.nodes().forEach((v) => {
      let graph_node = self.g.node(v)
      if (graph_node) {
        const key = graph_node.label //グラフ構造のlabelにidを設定しています
        let node = GraphUtil.getNode(nodes, key)
        if (node) {
          // node.setFrame({
          //   x: graph_node.x,
          //   y: graph_node.y,
          //   width: graph_node.width,
          //   height: graph_node.height,
          // })
          node.position = {x:graph_node.x, y:graph_node.y};
          node.size = {width:graph_node.width, height:graph_node.height};
        }
      }
    })
    return nodes
  }

  /**
   * ノードの取得
   * @param nodes
   * @param key
   * @returns {*}
   */
  static getNode(nodes: any[], key: string) {
    let node = nodes.find((node) => {
      return node.id === key
    })
    return node
  }

  /**
   * ノードの置き換え
   * @returns {any[]}
   * @param parameters
   */
  static updateNode(parameters: { nodes: any[], key: string, new_node: any }) {
    let { nodes, key, new_node } = parameters
    let new_nodes = nodes.map((node: any) => {
      if (node.id === key) {
        return new_node
      } else {
        return node
      }
    })
    return new_nodes
  }

  /**
   * ノードの取得
   * @param nodes
   * @param keySet
   * @returns {*}
   */
  static getNewNodesWithIncludeKeys(nodes: any[], keySet: Set<string>) {
    let node = nodes.filter((node) => {
      return (keySet.has(node.id))
    })
    return node
  }

  /**
   * ノードの取得
   * @param nodes
   * @param keySet
   * @returns {*}
   */
  static getNewNodesWithExculudeKeys(nodes: any[], keySet: Set<string>) {
    let node = nodes.filter((node) => {
      return !(keySet.has(node.id))
    })
    return node
  }

  /**
   * JSONからの読み出し
   * @param json
   * @returns {*}
   */
  load(json: Flow) {
    const self = this
    let hasPosition = false

    // if (!json || !json.nodes) return new FlowModel()
    if (!json || !json.nodes) {
      return {
        label: '',
        nodes: [],
        params:[],
        ports: [[], []],
        description: '',
      }
    }

    const connectEdge = (node:CommandNodeType) => {
      if (node.srcs) {
        Object.keys(node.srcs).forEach((portLabel) => {
          const src = node.srcs![portLabel]
          const from = src
          const to = node.id
          const label = GraphUtil.edgeName(from, to, portLabel)//src
          self.addEdge(from, to, label)
        })
      }
      if (node.dsts) {
        Object.keys(node.dsts).forEach((portLabel) => {
          const dst = node.dsts![portLabel]
          const from = node.id
          const to = dst
          const label = GraphUtil.edgeName(from, to, portLabel)//dst
          self.addEdge(from, to, label)
        })
      }
    }

    let newNodes: (FrameNodeType | CommandNodeType |  NoteNodeType)[] = [];
    json.nodes.forEach((node) => {
      self.addNode(node.id)
      const type = node.type
      switch (type) {
        //データフレーム
        case Constants.step.type.frame:
          const frame:FrameNodeType = {
            id: node.id,
            label: node.label,
            type: 'frame',
            position: node.position,
            size: node.size,
            error: node.error,
            invalid: node.invalid,
            uuid: node.uuid,
            value: node.value,
            makeCache: node.makeCache,
            dataSource: node.dataSource,
            cacheCreatedAt: node.cacheCreatedAt,
            hasData: () => !!frame.uuid,
            isCached: () => !!frame.cacheCreatedAt,
            deleteCache: () => {
              frame.cacheCreatedAt = null;
              frame.uuid = null;
            },
          };
          newNodes.push(frame);
          if (frame.position && frame.size) {
            hasPosition = true
          }
          break
        case Constants.step.type.command:
          const c:CommandNodeType = {
            id: node.id,
            label: node.label,
            type: 'command',
            position: node.position,
            size: node.size,
            error: node.error,
            invalid: node.invalid,
            commandId: node.commandId,
            args: node.args,
            srcs: node.srcs,
            dsts: node.dsts,
            srcsOrder: node.srcsOrder,
            deleteInPort : (label:string) => {
              c.srcs && delete c.srcs[label];
              if(c.srcsOrder){
                  c.srcsOrder = c.srcsOrder.filter(srcLabel => srcLabel !== label);
              }
            },
            addInPort : (label:string, nodeId:string) => {
                if(!c.srcs){
                    c.srcs = {};
                }
                c.srcs[label] = nodeId;
                if(!c.srcsOrder){
                    c.srcsOrder = [];
                }
                c.srcsOrder.push(label);
            },
            getInPortIndex : () => {
                const srcKeys = Object.keys(c.srcs || {});
    
                const filterKeys = srcKeys.filter((key) => {
                    return (key.indexOf("*") != -1);
                });
        
                let max = 0;
                filterKeys.forEach((key) => {
                    const value = key.replace("*", "");
                    max = (parseInt(value) > max) ? parseInt(value) : max;
                });
        
                return max;
            },
            addableInPort : () => {
                // コマンドが複数入力可能かどうかを判断するため、元のコマンドのInPort定義に＊があるか確認する
                const filterKeys = c.getCommand().ports[0].filter((inPort) => {
                    return (inPort.label.indexOf("*") >= 0);
                });
                return filterKeys.length > 0;
            },
            getCommand : () => {
                const commands = (window as any).commands;
                return commands.find(command => command.id === c.commandId);
            },
          };

          connectEdge(c)
          newNodes.push(c);
          if (c.position && c.size) {
            hasPosition = true
          }
          break;

        case Constants.step.type.subflow:
          //コマンド
          const step = node
          let model = {
            id: step.id,
            name: step.name,
            label: step.label,
            type: step.type,
            commandId: step.commandId,
            uuid: step.uuid,
            srcs: step.srcs,
            dsts: step.dsts,
            args: step.args,
            position: step.position,
            size: step.size,
            masked: step.masked,
            srcsOrder: step.srcsOrder,
            getSrcsSteps: step.getSrcsSteps,
            getDstsSteps: step.getDstsSteps,
            getCommand: step.getCommand
          }
          if (step.flow && step.classification === "data_source") {
            node = new DataSrcStepModel({ ...step })
          } else if (step.flow && step.classification === "data_dest") {
            node = new DataDstStepModel({ ...step })
          } else if (type === Constants.step.type.subflow) {
            model.type = Constants.step.type.subflow
            model.uuid = step.uuid
            node = new SubFlowStepModel(model);
          } else {
          }

          newNodes.push(node)

          const hasSrcs = (Object.keys(step.srcs).length)
          const hasDsts = (Object.keys(step.dsts).length)

          if (hasSrcs) {
            Object.keys(step.srcs).forEach((portLabel) => {
              const src = step.srcs[portLabel]
              const from = src
              const to = node.id
              const label = GraphUtil.edgeName(from, to, portLabel)//src
              self.addEdge(from, to, label)
            })
          }
          if (hasDsts) {
            Object.keys(step.dsts).forEach((portLabel) => {
              const dst = step.dsts[portLabel]
              const from = node.id
              const to = dst
              const label = GraphUtil.edgeName(from, to, portLabel)//dst
              self.addEdge(from, to, label)
            })
          }
          if (step.position && step.size) {
            hasPosition = true
          }
          break
        case Constants.step.type.note:
          const note:NoteNodeType = {
            id: node.id,
            label: node.label,
            type: 'note',
            position: node.position,
            size: node.size,
            error: node.error,
            invalid: node.invalid,
            title: node.title,
            content: node.content,
            fontSize: node.fontSize,
            color: node.color,
            setTitle: (title:string) => {
              note.title = title;
              note.size = calcSize(title, note.fontSize || 16);
            },
            setFontSize: (fontSize:number) => {
                note.fontSize = fontSize;
                note.size = calcSize(note.title, fontSize);
            },
          };
          newNodes.push(note);

          break

        default:
      }
    })

    json.nodes = newNodes
    if (!hasPosition) this.refreshPosition(json.nodes)

    return json

  }
}

export default GraphUtil
