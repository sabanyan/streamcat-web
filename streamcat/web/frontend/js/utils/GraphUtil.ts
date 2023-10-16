//@flow
import dagre from 'dagre'
import Constants from 'Constants/index'
import { FlowUtil, ZoomUtil } from 'Utils/index'
import { CommandNodeType, FlowNodeType, InlineFlowNodeType } from 'Model/Node/NodeTypes'
import { AllNodeType, Flow } from 'Model/Library'

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
   * 指定するidのノードの有無を調べる
   * @param id 
   * @returns 
   */
  existsNode(id:string) {
    return this.g.nodes().some(nodeId => nodeId === id);
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
  removeAllEdges(edges: {v:string, w:string, name:string}[]) {
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

  getGraph(nodes:AllNodeType[], zoom:number) {
    const graph = this.g.graph()
    const graph_nodes = this.g.nodes()
    const edges = this.g.edges()
    if (nodes.length > 0) {
      const width = nodes.map(node =>
        node.position.x + node.size!.width || 0
      ).reduce((prevX, x) =>
        Math.max(prevX,x)
      );

      const height = nodes.map(node =>
        node.position.y + node.size!.height || 0
      ).reduce((prevY, y) =>
        Math.max(prevY,y)
      );

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
   * 各ノードとエッジの関係から計算された位置をNodeに設定する
   * @param nodes
   * @returns {*}
   */
  refreshPosition(nodes: AllNodeType[]) {
    const self = this;
    this.layout();
    this.g.nodes().forEach((v) => {
      const graph_node = self.g.node(v);
      if (graph_node) {
        const id = graph_node.label; //グラフ構造のlabelにidを設定しています
        if(GraphUtil.NodeExists(nodes, id)){
          const node = GraphUtil.getNode(nodes, id);
          node.position = {x:graph_node.x, y:graph_node.y};
          node.size = {width:graph_node.width, height:graph_node.height};
        }
      }
    })
    return nodes;
  }

  // 指定したidのノードが存在する場合はtrue
  static NodeExists(nodes:AllNodeType[], id:string){
    return nodes.findIndex(node => node.id === id) >= 0;
  }

  /**
   * ノードの取得
   * @param nodes
   * @param id
   * @returns {*}
   */
  static getNode(nodes: AllNodeType[], id: string) {
    const node = nodes.find(node => node.id === id);
    if(!node){
      throw new Error(`${id} is not found in nodes`);
    }
    return node;
  }

  /**
   * ノードの置き換え
   * @returns {AllNodeType[]}
   * @param parameters
   */
  static updateNode(parameters: { nodes: AllNodeType[], id: string, new_node: AllNodeType }) {
    const { nodes, id, new_node } = parameters
    const index = nodes.findIndex(node => node.id===id);
    nodes[index] = new_node;
    return nodes;
  }

  /**
   * ノードの取得
   * @param nodes
   * @param idSet
   * @returns {*}
   */
  // static getNewNodesWithExculudeKeys(nodes: AllNodeType[], idSet: Set<string>) {
  //   return nodes.filter((node) => {
  //     return !(idSet.has(node.id))
  //   });
  // }

  /**
   * JSONからの読み出し
   * @param json
   * @returns {*}
   */
  load(json: Flow) {
    const self = this

    // if (!json || !json.nodes) return new FlowModel()
    // if (!json || !json.nodes) {
    //   return {
    //     label: '',
    //     nodes: [],
    //     params:[],
    //     ports: [[], []],
    //     description: '',
    //   }
    // }

    const connectEdge = (node:CommandNodeType | FlowNodeType | InlineFlowNodeType) => {
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
          if(to){
            // toがundefinedの場合にEdgeを描画すると
            // Nodeの整列時にposition.xがNaNになりエラーが発生する
            const label = GraphUtil.edgeName(from, to, portLabel);
            self.addEdge(from, to, label);
          }
        })
      }
    }

    // positionプロパティを持たないNodeが存在する場合はtrue
    let noPosition = false;

    json.nodes.forEach(node => {
      // 
      self.addNode(node.id);
      // 
      if(!node.position){
        noPosition = true;
      }
      if(node.type === 'command' || node.type === 'flow'){
        connectEdge(node as CommandNodeType | FlowNodeType | InlineFlowNodeType);
      }
    });

    // positionプロパティを持たないNodeが存在する場合は全Nodeを整列する
    noPosition && this.refreshPosition(json.nodes);

    return json

  }
}

export default GraphUtil
