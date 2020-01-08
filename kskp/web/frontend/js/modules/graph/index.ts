import dagre from 'dagre'
import Constants from 'Constants/index'
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
  g:dagre.graphlib.Graph

  constructor () {
    this.g = new dagre.graphlib.Graph({multigraph: true})
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
  addNode (id: string) {
    this.g.setNode(id, {
      label: id,
      width: defaultNodeProps.width,
      height: defaultNodeProps.height,
    })
  }

  outEdges (id: string) {
    return this.g.outEdges(id)
  }

  inEdges (id: string) {
    return this.g.inEdges(id)
  }

  nodeEdges (id: string) {
    return this.g.nodeEdges(id)
  }

  static edgeName (v: string, w: string, port_name: string) {
    return JSON.stringify({v: v, w: w, port_name: port_name})
  }

  /**
   * ノードの削除
   * @param id
   */
  removeNode (nodes: [], id: string): [] {
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
  addEdge (from_id: string, to_id: string, name: string) {
    this.g.setEdge({v: from_id, w: to_id, name: name})
  }

  /**
   * エッジの削除
   * @param from_id
   * @param to_id
   */
  removeEdge (from_id: string, to_id: string, name: string) {
    this.g.removeEdge({v: from_id, w: to_id, name: name})
  }

  /**
   * 全エッジの削除
   * @param edges
   */
  removeAllEdges (edges: any[]) {
    edges.forEach((edge) => {
      const from = edge.v
      const to = edge.w
      const portName = edge.name
      this.removeEdge(from, to, portName)
    })
  }

  /**
   * dagreによるレイアウト
   */
  layout () {
    dagre.layout(this.g)
  }

  /**
   * グラフサイズの取得
   * @returns {{width, height}}
   */

  getGraph (nodes, zoom) {
    const graph = this.g.graph()
    const graph_nodes = this.g.nodes()
    const edges = this.g.edges()
    if (nodes) {
      const width = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.x + nodes[key].size.width))
      const height = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.y + nodes[key].size.height))
      return {width: ZoomUtil.zoom(width, zoom), height: ZoomUtil.zoom(height, zoom), nodes: graph_nodes, edges: edges}
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
  refreshPosition (nodes: any[]) {
    const self = this
    this.layout()
    this.g.nodes().forEach((v) => {
      let graph_node = self.g.node(v)
      if (graph_node) {
        const key = graph_node.label //グラフ構造のlabelにidを設定しています
        let node:any = Graph.getNode(nodes, key)
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
  static getNode (nodes: any[], key: string) {
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
  static updateNode (parameters: { nodes: [], key: string, new_node: any }) {
    let {nodes, key, new_node} = parameters
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
  static getNewNodesWithIncludeKeys (nodes: [], keySet: any) {
    let node = nodes.filter((node:any) => {
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
  static getNewNodesWithExculudeKeys (nodes: [], keySet:any) {
    let node = nodes.filter((node:any) => {
      return !(keySet.has(node.id))
    })
    return node
  }

  /**
   * @param FlowModel
   * @returns {*}
   */
  load (flow: FlowModel) {
    if (!flow.nodes) return

    let hasPosition:boolean = true
    flow.nodes.forEach((node, index) => {
      this.addNode(node.id)

      const hasSrcs = (Object.keys(node.srcs).length)
      const hasDsts = (Object.keys(node.dsts).length)

      if (hasSrcs) {
        Object.keys(node.srcs).forEach((portName) => {
          const src = node.srcs[portName]
          const from = src
          const to = node.id
          const label = Graph.edgeName(from, to, portName)//src
          node.addEdge(from, to, label)
        })
      }
      if (hasDsts) {
        Object.keys(node.dsts).forEach((portName) => {
          const dst = node.dsts[portName]
          const from = node.id
          const to = dst
          const label = Graph.edgeName(from, to, portName)//dst
          node.addEdge(from, to, label)
        })
      }
      if (!node.position || !node.size) {
        hasPosition = false
      }
    })
    if (!hasPosition) this.refreshPosition(flow.nodes)
  }
}
