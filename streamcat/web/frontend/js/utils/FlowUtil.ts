//@flow
import Constants from 'Constants/index'
import { MessageModel} from 'Model/index'
import { Api } from 'Api';
import { CommandNodeType, FlowNodeType, InlineFlowNodeType } from 'Model/Node/NodeTypes';

export default class FlowUtil {

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
   * Srcsをクリアする
   */
  static clearSrcs (node: CommandNodeType | FlowNodeType | InlineFlowNodeType): CommandNodeType | FlowNodeType | InlineFlowNodeType {
    node.srcs && Object.keys(node.srcs).forEach((key) => {
      if(node.srcs){
        //入力はポートは残して、接続先を空にする
        node.srcs[key] = ''
      }
    })
    return node
  }

  /**
   * Positionを少しずらしてコピーする
   */
  static shiftPosition (position: {x:number,y:number}){
    return {
      x: position.x + Constants.default.graph.nodeSeparator,
      y: position.y + Constants.default.graph.rankSeparator
    };
  }

}
