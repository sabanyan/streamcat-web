import _ from 'lodash';
import { AllNodeType, Command } from 'Model/Library';
import {
    FrameNodeType,
    CommandNodeType,
    NoteNodeType,
    FrameNode,
    BaseFlowNodeType,
    calcSize,
    addInPort
} from 'Model/Step/NodeTypes';
import { makeArrayCtor } from './ApiBase';

/**
 * NodeArrayのコンストラクタ関数を作成する
 */

export const setFrameNodeFunc = (node:FrameNodeType) => {
    node.clone = (id:string, position?:{x:number, y:number}) => {
        const ret = new FrameNode(id, position || node.position);
        ret.label = node.label;
        return ret;
    };
    node.hasData = () => !!node.uuid;
    node.isCached = () => !!node.cacheCreatedAt;
    node.deleteCache = () => {
        node.cacheCreatedAt = null;
        node.uuid = null;
    };
};

export const setCommandNodeFunc = (node:CommandNodeType) => {
    node.deleteInPort = (label:string) => {
        node.srcs && delete node.srcs[label];
        if(node.srcsOrder){
            node.srcsOrder = node.srcsOrder.filter(srcLabel => srcLabel !== label);
        }
    };
    node.addInPort = (label:string, nodeId:string) => addInPort(node, label, nodeId);
    node.getInPortIndex = () => {
        const srcKeys = Object.keys(node.srcs || {});

        const filterKeys = srcKeys.filter((key) => {
            return (key.indexOf('*') != -1);
        });

        let max = 0;
        filterKeys.forEach((key) => {
            const value = key.replace('*', '');
            max = (parseInt(value) > max) ? parseInt(value) : max;
        });

        return max;
    };
    node.addableInPort = (command: Command) => {
        // コマンドが複数入力可能かどうかを判断するため、元のコマンドのInPort定義に＊があるか確認する
        const filterKeys = command.ports[0].filter((inPort) => {
            return (inPort.label.indexOf('*') >= 0);
        });
        return filterKeys.length > 0;
    };
};

export const setFlowNodeFunc = (node:BaseFlowNodeType) => {
    node.addInPort = (label:string, nodeId:string) => addInPort(this, label, nodeId);
    node.addableInPort = () => false;
};

export const setNoteNodeFunc = (node:NoteNodeType) => {
    node.setTitle = (title) => {
        node.title = title;
        node.size = calcSize(title, node.fontSize || 16);
    };
    node.setFontSize = (fontSize) => {
        node.fontSize = fontSize;
        node.size = calcSize(node.title, fontSize);
    };
};

export const NodeArray = makeArrayCtor<AllNodeType>(node => {
    if(node.type === 'frame'){
        const n = node as FrameNodeType;
        setFrameNodeFunc(n);
    }else if(node.type === 'command'){
        const c = node as CommandNodeType;
        setCommandNodeFunc(c);
    }else if(node.type === 'flow'){
        if(!node.hasOwnProperty('uuid') && !node.hasOwnProperty('flow')){
            throw new Error('Flow node has not neither uuid nor flow property');
        }
        const f = node as BaseFlowNodeType;
        setFlowNodeFunc(f)
    }else if(node.type === 'note'){
        const n = node as NoteNodeType;
        setNoteNodeFunc(n);
    }else{
        // TODO: 他のNodeTpeを追加予定
    }
});
