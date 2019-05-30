export default class ConversionUtil {

  /* issue147の仕様通り変更
  {
     "name": "対応するデータノードのid",
     "type": "frame"
  }
  から
  {
     "label": "(任意のポート名)"
     "nodeId": "対応するデータノードのid",
     "type": "frame"
  }
  へ変更

  ToDo: 将来、必要であれば、平行処理（Parallel Loop）を検討してもいいかも
  */
  static convertPortsTo147 (inOrOutPorts: [], nodes: []): [] {
    let newPorts = []
    inOrOutPorts.forEach((port) => {
      const target = nodes.find((node) => {
        return (port.name === node.id)
      })
      let newPort = {
        label: target.label,
        nodeId: port.name,
        type: port.type
      }
      newPorts.push(newPort)
    })
    return newPorts
  }
}