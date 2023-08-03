//@flow
import Constants from 'Constants/index'
import type { CommandParamType, StepModelType } from 'Types/index'
import { CommandStepModel, DataFrameStepModel, SubFlowStepModel, CommandModel, MessageModel, BaseStepModel} from 'Model/index'
import { Api } from 'Api';
import { CommandNode, CommandNodeType, FlowNode, FlowNodeType, FrameNode, FrameNodeType } from 'Model/Step/NodeTypes';
import { Command } from 'Model/Library';

export default class FlowUtil {

  static getAllDataFrame (nodes: StepModelType[]) {
    return nodes.filter((node) => {
      if (node.type === 'frame') {
        return true
      }
      return false
    })
  }

  static getNodeFromID (nodes: StepModelType[], id: string) {
    return nodes.find((node) => {
      if (node.type === 'frame') {
        return (node.id === id)
      }
      return false
    })
  }

  static getCommandParam (paramName: string, command: Command): (CommandParamType | {}) {
    let param = {}
    if (command && command.params) {
      command.params.map((_param) => {
        if (_param.name === paramName) {
          param = _param
        }
      })
    }
    return param
  }

  static getFlowJson (nodes: BaseStepModel[], projectId: string, projectName: string): {} {
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
  // static replaceNodeIds (replaceKeyPairs: {}, nodes: []) {
  //   nodes.map((node) => {
  //     if (node.dsts) {
  //       let newDsts = {}
  //       Object.keys(node.dsts).forEach((from) => {
  //         const newFromId = this.replaceNodeId(replaceKeyPairs, from)
  //         const to = node.dsts[from]
  //         const newToId = this.replaceNodeId(replaceKeyPairs, to)
  //         newDsts[newFromId] = newToId
  //       })
  //       node.dsts = newDsts
  //     }

  //     if (node.srcs) {
  //       let newSrcs = {}
  //       Object.keys(node.srcs).forEach((from) => {
  //         const newFromId = this.replaceNodeId(replaceKeyPairs, from)
  //         const to = node.srcs[from]
  //         const newToId = this.replaceNodeId(replaceKeyPairs, to)
  //         newSrcs[newFromId] = newToId
  //       })
  //       node.srcs = newSrcs
  //     }
  //     return node
  //   })
  //   return nodes
  // }

  // static replaceNodeId (replaceKeyPairs: {}, nodeId: string): string {
  //   let newNodeId = nodeId
  //   Object.keys(replaceKeyPairs).forEach((key) => {
  //     if (nodeId === key) {
  //       newNodeId = replaceKeyPairs[key]
  //     }
  //   })
  //   return newNodeId
  // }

  static removeNodeId (nodes: CommandNodeType[], node_ids: string[]) {
    node_ids.forEach((removeId) => {
      nodes.forEach((node) => {
        if (node.dsts) {
          Object.keys(node.dsts).forEach((from) => {
            const to = node.dsts![from]
            //if (from === removeId || to === removeId)
            if (to === removeId)
            //node.dsts[from] = null;
            delete node.dsts![from]
          })
        }
        if (node.srcs) {
          Object.keys(node.srcs).forEach((from) => {
            const to = node.srcs![from]
            //if (from === removeId || to === removeId)
            if (to === removeId)
              //node.srcs[from] = null;
              delete node.srcs![from]
          })
        }
      })
    })
    return nodes
  }

  static runWithArgs (runArgs:any, notifyLoading:Function, notifyWarning:Function, notifyError:Function, dismissNotify:Function) {
    let notoficationId = '';
    notifyLoading && (notoficationId = notifyLoading('フローを実行しています'));

    // フロー実行ではキャッシュ作成を許可する
    let args = {use_cache: true}

    runArgs.variables.map((v) => {
      args[v.name] = v.value
    })

    // フローを実行する
    return Api.createActivity(runArgs.flowUuid, args, runArgs.lockUuid).catch(error => {
      let message = new MessageModel(error);
      console.log(error);
      if(error.code===-4){
        // code=-4は警告を示す
        notifyWarning(message.title, error.message);
      }else{
        notifyError(message.title, error.message);
      }
      throw error;
    }).then(activity => {
      // NOTE: then句の中で送出した例外がその後のcatch句で捕捉されてしまう
      // そのため、catch句の後にthen句を記述する
      if(activity.outs.length === 0){
        const errorMessage = '実行結果は出力されませんでした'
        notifyWarning('警告', errorMessage);
        throw new Error(errorMessage);
      }
      return activity;
    }).finally(() => {
      dismissNotify && dismissNotify(notoficationId);
    });
  }

  /**
   * 指定位置の付近に別のノードがないか調べて、ある場合は重ならない位置を再帰的に計算する
   */
  static getNotOverlapNodePosition ({x, y}: { x: number, y: number }, nodes: {position:{x:number,y:number}}[]) {
    let result = {x: x, y: y}
    const threshold = 3
    nodes.forEach((node) => {
      //座標位置に対して前後 3pxの範囲で重複する場合のみ再度位置調整をする
      if (node.position.x >= x - threshold &&
          node.position.x <= x + threshold &&
          node.position.y >= y - threshold &&
          node.position.y <= y + threshold) {
        //合致していた場合新しい座標を計算
        result = FlowUtil.getNotOverlapNodePosition({x: x + 10, y: y + 10}, nodes)
      }
    })
    return result
  }

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

  static setModelType (json: any): StepModelType {
    if (json['srcs'] !== undefined && json['dsts'] !== undefined && json['uuid'] !== undefined) {

      const node:FlowNodeType = new FlowNode(json.uuid, json.position);
      (node as any).id = json.id;
      node.label = json.label;
      node.args = json.args;
      node.srcs = json.srcs;
      node.dsts = json.dsts;
      node.srcsOrder = json.srcsOrder;

      return node;
    }
    if (json['srcs'] !== undefined && json['dsts'] !== undefined) {
      // let node = new CommandStepModel(json)
      // node.loadArgs()

      const node:CommandNodeType = new CommandNode(json.commandId, json.position);
      (node as any).id = json.id;
      node.label = json.label;
      node.args = json.args;
      node.srcs = json.srcs;
      node.dsts = json.dsts;
      node.srcsOrder = json.srcsOrder;

      return node;
    }
    if (json['uuid'] !== undefined && json['dataSource'] !== undefined){
      const newNode:FrameNodeType = new FrameNode({x:0, y:0});
      newNode.label = json.label;
      newNode.uuid = json.uuid;
      newNode.makeCache = json.makeCache;
      newNode.cacheCreatedAt = json.cacheCreatedAt;
      return newNode;
    }
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