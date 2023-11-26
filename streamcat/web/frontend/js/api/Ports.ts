import { Port } from 'Model/Library';

/**
 * PortArrayのコンストラクタ関数を作成する
 */
export const PortArray = function(this: any, ports: Port[]){
    Array.prototype.push.apply(this, ports);
    // JsonStringify()でlengthプロパティをJSON文字列から除外するために設定しておく
    this.__allAPIFuncSet = true;
};
PortArray.prototype = Object.create(Array.prototype);
PortArray.prototype.constructor = PortArray;

PortArray.prototype.exists = function(portId: string){
    // TODO: Portの識別子はnodeIdからlabelに変更予定
    return !!PortArray.prototype.find.apply(this, [p => p.nodeId === portId]);
};

PortArray.prototype.upsert = function(port: Port){
    const findPort = PortArray.prototype.find.apply(this, [p => p.nodeId === port.nodeId]);
    if(findPort){
        // 既に存在する場合は更新する
        findPort.label = port.label;
        findPort.type = port.type;
    }else{
        // 存在しない場合は追加する
        this.push(port);
    }
};

PortArray.prototype.removeByNodeId = function(nodeId: string){
    const index = PortArray.prototype.findIndex.apply(this, [p => p.nodeId === nodeId]);
    if(index === -1){
        // 存在しない場合は何もしない
        return;
    }
    // 存在する場合は削除する
    PortArray.prototype.splice.apply(this, [index, 1]);
};
