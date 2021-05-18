import dagre from 'dagre'
import Constants from 'Constants/index'
import { CommandStepModel, DataFrameStepModel, NoteStepModel, SubFlowStepModel } from 'Model/index'
import { FlowUtil, ZoomUtil } from 'Utils/index'
import FlowModel from 'Model/Flow/FlowModel'

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

export default class Graph {
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


  addNode(id: string) {
    this.g.setNode(id, {
      label: id,
      width: defaultNodeProps.width,
      height: defaultNodeProps.height,
    })
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

  edgeName(v: string, w: string, port_name: string) {
    return JSON.stringify({ v: v, w: w, port_name: port_name })
  }


  /**
   * ノードの削除
   * @param id
   */
  removeNode(nodes: any[], id: string) {
    const edges = this.g.nodeEdges(id)
    if (Array.isArray(edges)) {
      edges.forEach((edge) => {
        this.g.removeEdge(edge)
      })
    }
    this.g.removeNode(id);
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
  removeAllEdges(edges: []) {
    edges.forEach((edge: any) => {
      const from = edge.v
      const to = edge.w
      const portName = edge.name
      this.removeEdge(from, to, portName)
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

  getGraph(nodes: any[]) {
    const graph = this.g.graph()
    const graph_nodes = this.g.nodes()
    const edges = this.g.edges()

    let width = graph.width;
    let height = graph.height;


    if (nodes) {
      width = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.x + nodes[key].size.width))
      height = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.y + nodes[key].size.height))
    }

    return {
      width: width,
      height: height,
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
    this.layout()
    this.g.nodes().forEach((v) => {
      let graph_node = this.g.node(v)
      if (graph_node) {
        const key = graph_node.label //グラフ構造のlabelにidを設定しています
        let node: any = this.getNode(nodes, key)
        if (node) {
          node.setFrame({
            x: graph_node.x,
            y: graph_node.y,
            width: graph_node.width,
            height: graph_node.height,
          })
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
  getNode(nodes: any[], key: string) {
    let node = nodes.find((node: any) => {
      return node.id === key
    })
    return node
  }


  /**
   * ノードの置き換え
   * @returns {any[]}
   * @param parameters
   */
  updateNode(parameters: { nodes: any[], key: string, new_node: any }) {
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
  getNewNodesWithIncludeKeys(nodes: [], keySet: any) {
    let results = nodes.filter((node: any) => {
      return (keySet.has(node.id))
    })
    return results
  }

  /**
   * ノードの取得
   * @param nodes
   * @param keySet
   * @returns {*}
   */
  getNewNodesWithExculudeKeys(nodes: [], keySet: Set<any>) {
    let results = nodes.filter((node: any) => {
      return !(keySet.has(node.id))
    })
    return results
  }
}


