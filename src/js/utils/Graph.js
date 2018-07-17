import dagre from 'dagre'
import Constants from '../constants'
import CommandStepModel from '../model/CommandStepModel'
import DataFrameStepModel from '../model/DataFrameStepModel'
import SubFlowStepModel from '../model/SubFlowStepModel'

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
      from_id.map((fid) => {
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
  getGraph (nodes) {
    const graph = this.g.graph()
    const graph_nodes = this.g.nodes()
    const edges = this.g.edges()

    if (nodes) {
      const width = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.x + nodes[key].size.width))
      const height = Math.max(...Object.keys(nodes).map((key) => nodes[key].position.y + nodes[key].size.height))
      return {width: width, height: height,nodes:graph_nodes, edges: edges}
    }

    return {width: graph.width, height: graph.height,nodes:graph_nodes, edges: edges}
  }

  /**
   * 各ノードとエッジの関係から計算された位置をstepに設定する
   * @param nodes
   * @returns {*}
   */
  refreshPosition (nodes) {
    const self = this
    this.layout()
    console.log("refreshPosition")
    console.log(this.g.nodes())
    this.g.nodes().forEach(function (v) {
      console.log(v)
      let graph_node = self.g.node(v)
      console.log(nodes)
      let step = nodes[graph_node.label]
      step.setFrame({
        x: graph_node.x,
        y: graph_node.y,
        width: graph_node.width,
        height: graph_node.height,
      })
    })
    return nodes
  }

  /**
   * JSONからの読み出し
   * @param json
   * @returns {*}
   */
  load (json) {
    const self = this
    let hasPosition = false
    if (json) {
      Object.keys(json.nodes).map((node) => {
        self.addNode(node)
        const type = json.nodes[node].type
        switch(type){
          //データフレーム
          case Constants.step.type.frame:
            const frame = json.nodes[node]
            json.nodes[node] = new DataFrameStepModel({
              id: node,
              type: Constants.step.type.frame,
              uuid: frame.uuid,
              dataSource: Constants.data.dataSource.csv,
              asFlowIn: frame.asFlowIn,
              asFlowOut: frame.asFlowOut,
              position: frame.position,
              size: frame.size,
            })
            if(frame.position && frame.size){
              hasPosition = true
            }
            break;
          case Constants.step.type.command:
          case Constants.step.type.subflow:
            //コマンド
            const step = json.nodes[node]

            const model = {
              id: node,
              type: Constants.step.type.command,
              name: step.name,
              label: step.label,
              srcs: step.srcs,
              dsts: step.dsts,
              args: step.args,
              position: step.position,
              size: step.size,
            }

            json.nodes[node] = (type === Constants.step.type.command)?new CommandStepModel(model):new SubFlowStepModel(model)

            const hasSrcs = (Object.keys(step.srcs).length)
            const hasDsts = (Object.keys(step.dsts).length)

            if (hasSrcs) {
              console.log("srcs")
              Object.keys(step.srcs).forEach((key) => {
                console.log(step.srcs)
                const src = step.srcs[key]
                console.log(src)
                const label = src + " => " + node
                console.log(label)
                const from = src
                const to = node
                self.addEdge(from, to, label)
              })
            }
            if (hasDsts) {
              console.log("dsts")
              Object.keys(step.dsts).forEach((key) => {
                const dst = step.dsts[key]
                const label = node + " => " + dst
                console.log(label)
                const from = node
                const to = dst
                self.addEdge(from, to, label)
              })
            }
            if(step.position && step.size){
              hasPosition = true
            }
        }
      })

      if(!hasPosition)this.refreshPosition({...json.nodes})

      return json
    }
  }
}

export default Graph
