//@flow
import Constants from 'Constants/index'
import type { CommandParamType, StepModelType, SubFlowParamType } from 'Types/index'
import { CommandStepModel, DataFrameStepModel, SubFlowStepModel } from 'Model/index'
import type { DataFrameStepModelProps } from 'Model/Step/DataFrameStepModel'
import { APIUtil, ErrorUtil, ReactDomUtil, ValidatorUtil } from 'Utils/index'

export default class FlowUtil {

  static getAllDataFrame (nodes: [StepModelType]) {
    return nodes.filter((node) => {
      if (node instanceof DataFrameStepModel) {
        return true
      }
      return false
    })
  }

  static getNodeFromID (nodes: [StepModelType], id: string) {
    return nodes.find((node) => {
      if (node instanceof DataFrameStepModel) {
        return (node.id === id)
      }
      return false
    })
  }

  static getCommandParam (paramName: string, command: CommandModel): (CommandParamType | {}) {
    let param = {}
    if (command && command.getParams()) {
      command.getParams().map((_param) => {
        if (_param.name === paramName) {
          param = _param
        }
      })
    }
    return param
  }

  static getSubFlowParam (subflow: SubFlowStepModel, paramName: string): (SubFlowParamType | {}) {
    let result = {}
    if (!subflow || !paramName) return null
    if (!subflow.params) return null

    subflow.params.forEach((param) => {
      if (param.name === paramName) {
        result = param
      }
    })
    return result
  }

  static getFlowJson (nodes: [], projectId: string, projectName: string): {} {
    const flow_json = {
      projectId: projectId,
      name: projectName,
      nodes: nodes,
    }
    return flow_json
  }

  /**
   * ノードのdsts,srcsのNodeIdをすべて書き換える
   * @param replaceKeyPairs
   * @param nodes
   */
  static replaceNodeIds (replaceKeyPairs: {}, nodes: []) {
    nodes.map((node) => {
      if (node.dsts) {
        let newDsts = {}
        Object.keys(node.dsts).forEach((from) => {
          const newFromId = this.replaceNodeId(replaceKeyPairs, from)
          const to = node.dsts[from]
          const newToId = this.replaceNodeId(replaceKeyPairs, to)
          newDsts[newFromId] = newToId
        })
        node.dsts = newDsts
      }

      if (node.srcs) {
        let newSrcs = {}
        Object.keys(node.srcs).forEach((from) => {
          const newFromId = this.replaceNodeId(replaceKeyPairs, from)
          const to = node.srcs[from]
          const newToId = this.replaceNodeId(replaceKeyPairs, to)
          newSrcs[newFromId] = newToId
        })
        node.srcs = newSrcs
      }
      return node
    })
    return nodes
  }

  static replaceNodeId (replaceKeyPairs: {}, nodeId: string): string {
    let newNodeId = nodeId
    Object.keys(replaceKeyPairs).forEach((key) => {
      if (nodeId === key) {
        newNodeId = replaceKeyPairs[key]
      }
    })
    return newNodeId
  }

  static removeNodeId (nodes: [], node_ids: []) {
    node_ids.forEach((removeId) => {
      nodes.forEach((node) => {
        if (node.dsts) {
          Object.keys(node.dsts).forEach((from) => {
            const to = node.dsts[from]
            if (from === removeId || to === removeId)
              delete node.dsts[from]
          })
        }
        if (node.srcs) {
          Object.keys(node.srcs).forEach((from) => {
            const to = node.srcs[from]
            if (from === removeId || to === removeId)
              delete node.srcs[from]
          })
        }
      })
    })
    return nodes
  }

  static runNodes (flowUUID: string, notify: Function, dismissNotify: Function): any {
    let runNotify
    if (notify) {
      runNotify = notify({
        title: 'フロー実行中',
        message: 'フローを実行しています',
        status: 'loading',
        dismissAfter: 0
      })
    }

    return new Promise((resolve, reject) => {
      APIUtil.get('frames?from=' + flowUUID + '&no_contents=1').then((response) => {
        if (dismissNotify) dismissNotify(runNotify.id)
        if (!response.data.success) {
          notify({
            title: '実行エラー',
            message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
            status: 'error',
            dismissAfter: 0,
            closeButton: true
          })
        }
        resolve(response)
      }, () => {
        if (dismissNotify) dismissNotify(runNotify.id)
        notify({
          title: '実行エラー',
          message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
        reject(error)
      })
    })
  }

  static runWithArgs (runArgs: {}, notify: Function, dismissNotify: Function): any {
    let runNotify
    if (notify) {
      runNotify = notify({
        title: 'フロー実行中',
        message: 'フローを実行しています',
        status: 'loading',
        dismissAfter: 0
      })
    }

    let args = {}

    runArgs.variables.map((v) => {
      args[v.name] = v.value
    })

    let body = {
      flow_uuid: runArgs.flow_uuid,
      args: args,
    }

    runArgs.flows.map((f) => {
      body[f.nodeId] = f.uuid
    })

    return new Promise((resolve, reject) => {
      APIUtil.post('frames', body).then((response) => {
        if (dismissNotify) dismissNotify(runNotify.id)
        if (!response.data.success) {
          notify({
            title: '実行エラー',
            message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
            status: 'error',
            dismissAfter: 0,
            closeButton: true
          })
        }
        resolve(response)
      }, () => {
        if (dismissNotify) dismissNotify(runNotify.id)
        notify({
          title: '実行エラー',
          message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
        reject(error)
      })
    })
  }

  /**
   * 指定位置の付近に別のノードがないか調べて、ある場合は重ならない位置を再帰的に計算する
   */
  static getNotOverlapNodePosition ({x, y}: { x: number, y: number }, nodes: []) {
    let result = {x: x, y: y}
    const threshold = 3
    nodes.forEach((node) => {
      //座標位置に対して前後 3pxの範囲で重複する場合のみ再度位置調整をする
      if (parseInt(node.position.x) >= parseInt(x) - threshold &&
        parseInt(node.position.x) <= parseInt(x) + threshold &&
        parseInt(node.position.y) >= parseInt(y) - threshold &&
        parseInt(node.position.y) <= parseInt(y) + threshold) {
        //合致していた場合新しい座標を計算
        result = FlowUtil.getNotOverlapNodePosition({x: x + 10, y: y + 10}, nodes)
      }
    })
    return result
  }

  /**
   * フローの保存
   * @param flowUUID
   * @param nodes
   * @param projectId
   * @param projectName
   * @returns {Promise<any>}
   */
  static saveNodes (flowUUID: string, nodes: [], notify?: Function, dismissNotify?: Function): any {
    //validation
    ValidatorUtil.nodesValidate(nodes)

    let saveNotify
    if (notify) {
      saveNotify = notify({
        title: 'フロー保存中',
        message: 'フローのノードを保存しています',
        status: 'loading',
        dismissAfter: 0
      })
    }

    return new Promise((resolve, reject) => {
      APIUtil.put('flows/' + flowUUID, {nodes: nodes}).then((response) => {
        if (dismissNotify) dismissNotify(saveNotify.id)
        if (!response.data.success) {
          notify({
            title: '実行エラー',
            message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
            status: 'error',
            dismissAfter: 0,
            closeButton: true
          })
        }
        resolve(response)
      }, (error) => {
        if (dismissNotify) dismissNotify(saveNotify.id)
        notify({
          title: '実行エラー',
          message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
        reject(error)
      })
    })
  }

  /**
   * フローの保存
   * @param flowUUID
   * @param label
   * @param description
   * @param params
   * @param ports
   * @returns {Promise<any>}
   */
  static saveFlowSettings (flowUUID: string, {label, description, params, ports}, notify: Function, dismissNotify: Function): any {
    let putBody = {}
    if (label) putBody['label'] = label
    if (description) putBody['description'] = description
    if (params) putBody['params'] = params
    if (ports) putBody['ports'] = ports

    let saveNotify
    if (notify) {
      saveNotify = notify({
        title: 'フロー保存中',
        message: 'フローの設定を保存しています',
        status: 'loading',
        dismissAfter: 0
      })
    }

    return new Promise((resolve, reject) => {
      APIUtil.put('flows/' + flowUUID, putBody).then((response) => {
        if (dismissNotify) dismissNotify(saveNotify.id)
        if (!response.data.success) {
          notify({
            title: '実行エラー',
            message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
            status: 'error',
            dismissAfter: 0,
            closeButton: true
          })
        }
        resolve(response)
      }, (error) => {
        if (dismissNotify) dismissNotify(saveNotify.id)
        notify({
          title: '実行エラー',
          message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
        reject(error)
      })
    })
  }

  static saveFlow (flowUUID: string, {label, description, params, ports, nodes}, notify: Function, dismissNotify: Function): any {
    //validation
    ValidatorUtil.nodesValidate(nodes)

    let putBody = {}
    if (label) putBody['label'] = label
    if (description) putBody['description'] = description
    if (params) putBody['params'] = params
    if (ports) putBody['ports'] = ports
    if (ports) putBody['nodes'] = nodes

    let saveNotify
    if (notify) {
      saveNotify = notify({
        title: 'フロー保存中',
        message: 'フローの設定を保存しています',
        status: 'loading',
        dismissAfter: 0
      })
    }

    return new Promise((resolve, reject) => {
      APIUtil.put('flows/' + flowUUID, putBody).then((response) => {
        if (dismissNotify) dismissNotify(saveNotify.id)
        if (!response.data.success) {
          notify({
            title: '実行エラー',
            message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
            status: 'error',
            dismissAfter: 0,
            closeButton: true
          })
        }
        resolve(response)
      }, (error) => {
        if (dismissNotify) dismissNotify(saveNotify.id)
        notify({
          title: '実行エラー',
          message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
        reject(error)
      })
    })
  }

  // static copyStep(step:StepModelType):StepModelType{
  // }

  /**
   * Srcsをコピーする
   */
  static copySrcs (step: StepModelType): StepModelType {
    Object.keys(step.srcs).forEach((key) => {
      //入力はポートは残して、接続先を空にする
      step.srcs[key] = null
    })
    return step
  }

  /**
   * Positionを少しずらしてコピーする
   */
  static copyPositionWithOffsetX (step: StepModelType): StepModelType {
    step.position.x = step.position.x + Constants.default.graph.nodeSeparator
    step.position.y = step.position.y + Constants.default.graph.rankSeparator
    return step
  }

  /**
   * Dstsをコピーする
   * @param step
   * @returns {StepModelType}
   */
  static copyDsts (step: StepModelType, addStepFunc): StepModelType {
    Object.keys(step.dsts).forEach((key) => {
      //出力先を作成し、接続先を変更する
      const copiedStep: DataFrameStepModel = FlowUtil.getNodeFromID(key)
      const props: DataFrameStepModelProps = {
        id: null,
        type: Constants.step.type.frame,
        uuid: null,
        label: 'コピー ' + copiedStep.label,
        dataSource: copiedStep.dataSource,
        srcs: step.id,
        dsts: [],
      }
      const add_step = new DataFrameStepModel(props)
      step.dsts[key] = add_step.id
    })

    return step
  }

  static setModelType (json: {}): StepModelType {
    if (json['srcs'] !== undefined && json['dsts'] !== undefined && json['uuid'] !== undefined) return new SubFlowStepModel(json)
    if (json['srcs'] !== undefined && json['dsts'] !== undefined) return new CommandStepModel(json)
    if (json['uuid'] !== undefined && json['dataSource'] !== undefined) return new DataFrameStepModel(json)
    return json
  }

  /**
   * フローの比較
   * @param flowA
   * @param flowB
   * @returns {boolean}
   */
  static isSameFlow (flowA: {}, flowB: {}) {
    return JSON.stringify(flowA) === JSON.stringify(flowB)
  }

  /**
   * ノードの集合体の比較
   * @param nodesA
   * @param nodesB
   * @returns {boolean}
   */
  static isSameNodes (nodesA: [], nodesB: []) {
    return JSON.stringify(nodesA) === JSON.stringify(nodesB)
  }

  /**
   * 現在のノードと履歴の一つ前のノードが一緒かどうか
   * @param history
   * @param currentNodes
   * @returns {boolean}
   */
  static isSameCurrentNodesToBeforeHistoryNodes (history, currentNodes) {
    if (!history) return false
    if (history.nodes[history.current].length !== currentNodes.length) return false
    return JSON.stringify(history.nodes[history.current]) === JSON.stringify(currentNodes)
  }

}