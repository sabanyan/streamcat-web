import dagre from 'dagre'
import OperatorModel from '../model/OperatorModel'
import Constants from '../constants'
import DataSourceModel from '../model/DataSourceModel'
import ModelUtil from '../utils/ModelUtil'
import StepModel from '../model/StepModel'
import DataFrameModel from '../model/DataFrameModel'

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
    this.g = new dagre.graphlib.Graph()
    this.g.setGraph({
      marginx: defaultGraphProps.marginX,
      marginy: defaultGraphProps.marginY,
      nodesep: defaultGraphProps.nodeSeparator,
      edgesep: defaultGraphProps.edgeSeparator,
      ranksep: defaultGraphProps.rankSeparator,
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
  addEdge (from_id, to_id) {
    this.g.setEdge(from_id, to_id)
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
  getGraphSize (steps) {
    if (steps) {
      const width = Math.max(...Object.keys(steps).map((key) => steps[key].position.x + steps[key].size.width))
      const height = Math.max(...Object.keys(steps).map((key) => steps[key].position.y + steps[key].size.height))
      return {width: width, height: height}
    }
    const graph = this.g.graph()
    return {width: graph.width, height: graph.height}
  }

  /**
   * 各ノードとエッジの関係から計算された位置をstepに設定する
   * @param steps
   * @returns {*}
   */
  refreshPosition (steps) {
    const self = this
    this.layout()
    this.g.nodes().forEach(function (v) {
      let graph_node = self.g.node(v)
      let step = steps[graph_node.label]
      step.setFrame({
        x: graph_node.x,
        y: graph_node.y,
        width: graph_node.width,
        height: graph_node.height,
      })
    })
    return steps
  }

  /**
   * JSONからの読み出し
   * @param json
   * @returns {*}
   */
  // load (json) {
  //   const self = this
  //   let hasPosition = false
  //   if (json) {
  //     //JSONのflowsを展開
  //     Object.keys(json.steps).map((node) => {
  //
  //       //各stepの値を FlowEditorで利用できるように DataSourceModel or OperatorModelに変換していく
  //       const step = json.steps[node]
  //
  //       //graphlibのノードに追加
  //       self.addNode(node)
  //
  //       if (step.position && step.size) {
  //         hasPosition = true
  //       }
  //       //TODO データソースかオペレータの判断を将来的には明確にする
  //       if (ModelUtil.isDataSouceModel(step)) {
  //         let property = {overview: {}, ...step.property}
  //         property.hasData = true
  //         json.steps[node] = new DataSourceModel({
  //           id: step.id,
  //           type: step.type,
  //           operator: step.operator,
  //           text: step.text,
  //           property: property,
  //           parameters: step.parameters,
  //           position: step.position,
  //           size: step.size,
  //         })
  //       }
  //       else {
  //         json.steps[node] = new OperatorModel({
  //           id: step.id,
  //           operator: step.operator,
  //           text: step.text,
  //           parameters: step.parameters,
  //           position: step.position,
  //           size: step.size,
  //         })
  //       }
  //     })
  //
  //     if (Array.isArray(json.edges)) {
  //       //JSONのedgesを展開
  //       json.edges.map((edge) => {
  //         //graphlibのエッジに追加
  //         self.addEdge(edge.v, edge.w)
  //       })
  //     }
  //
  //     //オペレータの位置情報がない場合はレイアウト位置を再計算する
  //     if (!hasPosition) {
  //       //graphlibのノードとエッジの状態からレイアウト位置を再計算する
  //       this.refreshPosition(json.steps)
  //     }
  //
  //     return json
  //   }
  // }
  getConnect (connects) {
    let result = {}
    if (Array.isArray(connects)) {
      connects.forEach((connect) => {
        const connect_arrays = connect.split('.')
        const step_name = connect_arrays[0]
        const port_name = connect_arrays[1]
        if (result[step_name] == null) {
          result[step_name] = [port_name]
        } else {
          result[step_name].push(port_name)
        }
      })
    }
    return result
  }

  getDstsPort (dsts) {
    return this.getConnect(dsts)
  }

  getSrcsPort (srcs) {
    return this.getConnect(srcs)
  }

  load (json) {
    const self = this
    let hasPosition = false
    if (json) {

      Object.keys(json.steps).map((node) => {
        self.addNode(node)
        const step = json.steps[node]
        json.steps[node] = new StepModel({
          id: node,
          type: Constants.step.type.command,
          name: step.name,
          label: step.label,
          args: step.args,
          position: step.position,
          size: step.size,
        })
        if(step.position && step.size){
          hasPosition = true
        }
      })

      Object.keys(json.data).map((node) => {
        self.addNode(node)
        const frame = json.data[node]
        if (frame.srcs.length > 0) {
          let srcsPort = self.getSrcsPort(frame.srcs)
          Object.keys(srcsPort).forEach((key) => {
            self.addEdge(key, node)
          })
        }
        if (frame.dsts.length > 0) {
          let dstsPort = self.getDstsPort(frame.dsts)
          Object.keys(dstsPort).forEach((key) => {
            self.addEdge(key, node)
          })
        }
        json.data[node] = new DataFrameModel({
          id: node,
          type: Constants.step.type.frame,
          uuid: frame.uuid,
          dataSource: Constants.data.dataSource.csv,
          srcs: frame.srcs,
          dsts: frame.dsts,
          asFlowIn: frame.asFlowIn,
          asFlowOut: frame.asFlowOut,
          position: frame.position,
          size: frame.size,
        })
        if(frame.position && frame.size){
          hasPosition = true
        }
      })


      if(!hasPosition)this.refreshPosition({...json.steps,...json.data})

      // //JSONのflowsを展開
      // Object.keys(json.data).map((node) => {
      //
      //   //各stepの値を FlowEditorで利用できるように DataSourceModel or OperatorModelに変換していく
      //   const step = json.steps[node]
      //
      //   //graphlibのノードに追加
      //   self.addNode(node)
      //
      //   if (step.position && step.size) {
      //     hasPosition = true
      //   }
      //   //TODO データソースかオペレータの判断を将来的には明確にする
      //   if (ModelUtil.isDataSouceModel(step)) {
      //     let property = {overview: {}, ...step.property}
      //     property.hasData = true
      //     json.steps[node] = new DataSourceModel({
      //       id: step.id,
      //       type: step.type,
      //       operator: step.operator,
      //       text: step.text,
      //       property: property,
      //       parameters: step.parameters,
      //       position: step.position,
      //       size: step.size,
      //     })
      //   }
      //   else {
      //     json.steps[node] = new OperatorModel({
      //       id: step.id,
      //       operator: step.operator,
      //       text: step.text,
      //       parameters: step.parameters,
      //       position: step.position,
      //       size: step.size,
      //     })
      //   }
      // })
      //
      // if (Array.isArray(json.edges)) {
      //   //JSONのedgesを展開
      //   json.edges.map((edge) => {
      //     //graphlibのエッジに追加
      //     self.addEdge(edge.v, edge.w)
      //   })
      // }
      //
      // //オペレータの位置情報がない場合はレイアウト位置を再計算する
      // if (!hasPosition) {
      //   //graphlibのノードとエッジの状態からレイアウト位置を再計算する
      //   this.refreshPosition(json.steps)
      // }

      return json
    }
  }
}

export default Graph
