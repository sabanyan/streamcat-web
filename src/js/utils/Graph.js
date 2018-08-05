import dagre from 'dagre'
import Constants from '../constants'
import CommandStepModel from '../model/Step/CommandStepModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import ZoomUtil from './ZoomUtil'
import FlowModel from '../model/Flow/FlowModel'

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

class Graph {

  constructor () {
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
   * @param node
   */
  addNode (id, from_id, node) {
    const self = this
    this.g.setNode(id, {
      label: id,
      width: defaultNodeProps.width,
      height: defaultNodeProps.height,
    })
    if (Array.isArray(from_id)) {
      from_id.forEach((fid) => {
        self.addEdge(fid, id)
      })
    }
    else if (from_id) {
      this.addEdge(from_id, id)
    }
  }

  outEdges (id) {
    return this.g.outEdges(id)
  }

  inEdges (id) {
    return this.g.inEdges(id)
  }

  nodeEdges (id) {
    return this.g.nodeEdges(id)
  }

  /**
   * ノードの削除
   * @param id
   */
  removeNode (id) {
    this.g.removeNode(id)
  }

  /**
   * エッジの追加
   * @param from_id
   * @param to_id
   */
  addEdge (from_id, to_id, name) {
    this.g.setEdge({v:from_id, w:to_id,name:name})
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
  getGraph ({nodes,zoom}) {
    const graph = this.g.graph()
    const graph_nodes = this.g.nodes()
    const edges = this.g.edges()

    if (nodes) {
      const width = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.x + nodes[key].size.width))
      const height = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.y + nodes[key].size.height))
      return {width: ZoomUtil.zoom(width,zoom), height: ZoomUtil.zoom(height,zoom),nodes:graph_nodes, edges: edges}
    }

    return {width: ZoomUtil.zoom(graph.width,zoom), height: ZoomUtil.zoom(graph.height,zoom),nodes:graph_nodes, edges: edges}
  }

  /**
   * 各ノードとエッジの関係から計算された位置をstepに設定する
   * @param nodes
   * @returns {*}
   */
  refreshPosition (nodes) {
    const self = this
    this.layout()
    this.g.nodes().forEach((v)=> {
      let graph_node = self.g.node(v)
      const key = graph_node.label //グラフ構造のlabelにidを設定しています
      let node = Graph.getNode(nodes,key)
      node.setFrame({
        x: graph_node.x,
        y: graph_node.y,
        width: graph_node.width,
        height: graph_node.height,
      })
    })
    return nodes
  }

  /**
   * ノードの取得
   * @param nodes
   * @param key
   * @returns {*}
   */
  static getNode(nodes,key){
    let node = nodes.find((node)=>{
      return node.id === key
    })
    return node
  }

  /**
   * ノードの置き換え
   * @param nodes
   * @param key
   * @returns {*}
   */
  static updateNode(nodes,key,new_node){
    let new_nodes = nodes.map((node)=>{
      if(node.id === key){
        return new_node
      }else{
        return node
      }
    })
    return new_nodes
  }

  /**
   * ノードの取得
   * @param nodes
   * @param key
   * @returns {*}
   */
  static getNewNodesWithIncludeKeys(nodes,keySet){
    let node = nodes.filter((node)=>{
      return (key_set.has(node.id))
    })
    return node
  }

  /**
   * ノードの取得
   * @param nodes
   * @param key
   * @returns {*}
   */
  static getNewNodesWithExculudeKeys(nodes,keySet){
    let node = nodes.filter((node)=>{
      return !(keySet.has(node.id))
    })
    return node
  }

  /**
   * JSONからの読み出し
   * @param json
   * @returns {*}
   */
  load (json) {
    const self = this
    let hasPosition = false

    if (!json.nodes) return new FlowModel()

    let newNodes = []
    json.nodes.forEach((node)=>{
      self.addNode(node.id)
      const type = node.type
      switch(type){
        //データフレーム
        case Constants.step.type.frame:
          const frame = node
          newNodes.push(new DataFrameStepModel({
            id: frame.id,
            type: Constants.step.type.frame,
            uuid: frame.uuid,
            dataSource: Constants.data.dataSource.csv,
            position: frame.position,
            size: frame.size,
          }))
          if(frame.position && frame.size){
            hasPosition = true
          }
          break;
        case Constants.step.type.command:
        case Constants.step.type.subflow:
          //コマンド
          const step = node

          let model = {
            id: step.id,
            name: step.name,
            label: step.label,
            srcs: step.srcs,
            dsts: step.dsts,
            args: step.args,
            position: step.position,
            size: step.size,
          }

          if(type === Constants.step.type.command){
            model.type = Constants.step.type.command
            model.commandId = step.commandId
            node = new CommandStepModel(model)
          }else if(type === Constants.step.type.subflow){
            model.type = Constants.step.type.subflow
            model.uuid = step.uuid
            node = new SubFlowStepModel(model)
          }

          newNodes.push(node)

          const hasSrcs = (Object.keys(step.srcs).length)
          const hasDsts = (Object.keys(step.dsts).length)

          if (hasSrcs) {
            Object.keys(step.srcs).forEach((key) => {
              const src = step.srcs[key]
              const label = src
              const from = src
              const to = node.id
              self.addEdge(from, to, label)
            })
          }
          if (hasDsts) {
            Object.keys(step.dsts).forEach((key) => {
              const dst = step.dsts[key]
              const label = dst
              const from = node.id
              const to = dst
              self.addEdge(from, to, label)
            })
          }
          if(step.position && step.size){
            hasPosition = true
          }
      }
    })

    json.nodes = newNodes
    if(!hasPosition)this.refreshPosition(json.nodes)

    return json

  }
}

export default Graph
