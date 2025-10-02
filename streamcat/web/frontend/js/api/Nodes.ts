import lodash from 'lodash';
import { AllNodeType, Command } from 'Model/Library';
import {
    NodeType,
    FrameNodeType,
    CommandNodeType,
    FlowNodeType,
    InlineFlowNodeType,
    NoteNodeType,
    BaseFlowNodeType,
    FrameNode,
    CommandNode,
    FlowNode,
    InlineFlowNode,
    NoteNode,
    calcSize,
    addInPort
} from 'Model/Node/NodeTypes';
import { makeArrayCtor } from './ApiBase';

/**
 * NodeArrayのコンストラクタ関数を作成する
 */

// Node共通のオブジェクト型プロパティを複製する
const cloneCommonNodeProps = (node:NodeType) => {
    let ret:{size?:{width:number,height:number}, error?:{}, invalid?:{}} = {};
    if(node.size){
        ret.size = {width:node.size.width, height:node.size.height};
    }
    if(node.error){
        ret.error = {};
    }
    if(node.invalid){
        ret.invalid = {};
    }
    return ret;
};

const cloneCommandNodeProps = (node:CommandNodeType|BaseFlowNodeType) => {
    let ret:{
        args?: { [name:string]:any },
        srcs?: { [port:string]:string },
        dsts?: { [port:string]:string },
        srcsOrder?: string[]
    } = {};
    if(node.args){
        ret.args = node.args;
    }
    if(node.srcs){
        ret.srcs = node.srcs;
    }
    if(node.dsts){
        ret.dsts = node.dsts;
    }
    if(node.srcsOrder){
        ret.srcsOrder = node.srcsOrder;
    }
    return lodash.cloneDeep<{
        args?: { [name:string]:any },
        srcs?: { [port:string]:string },
        dsts?: { [port:string]:string },
        srcsOrder?: string[]
    }>(ret);
};


export const setFrameNodeFunc = (node:FrameNodeType) => {
    node.clone = (id:string, position?:{x:number, y:number}) => {
        const newPosition = position? {x:position.x, y:position.y}: {x:node.position.x, y:node.position.y};
        const ret = new FrameNode(id, newPosition);
        ret.label = node.label;
        Object.assign(ret, cloneCommonNodeProps(node));
        ret.uuid = node.uuid;
        ret.makeCache = node.makeCache;
        ret.dataSource = node.dataSource;
        ret.cacheCreatedAt = node.cacheCreatedAt;
        setFrameNodeFunc(ret);
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
    node.clone = (id:string, position?:{x:number, y:number}) => {
        const newPosition = position? {x:position.x, y:position.y}: {x:node.position.x, y:node.position.y};
        const ret = new CommandNode(id, node.commandId, newPosition);
        ret.label = node.label;
        Object.assign(ret, cloneCommonNodeProps(node));
        Object.assign(ret, cloneCommandNodeProps(node));
        setCommandNodeFunc(ret);
        return ret;
    };
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
            return key.includes('*');
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
            return inPort.label.includes('*');
        });
        return filterKeys.length > 0;
    };
};

export const setFlowNodeFunc = (node:BaseFlowNodeType) => {
    node.clone = (id:string, position?:{x:number, y:number}) => {
        const newPosition = position? {x:position.x, y:position.y}: {x:node.position.x, y:node.position.y};
        let ret;
        if(node.hasOwnProperty('uuid')){
            ret = new FlowNode(id, (node as FlowNodeType).uuid, newPosition);
        }else{
            // NOTE: インラインFlowは変更されないので複製を取る必要はないだろう
            const flow = (node as InlineFlowNodeType).flow;
            ret = new InlineFlowNode(id, node.classification, flow, newPosition)
        }
        ret.label = node.label;
        Object.assign(ret, cloneCommonNodeProps(node));
        Object.assign(ret, cloneCommandNodeProps(node));
        setFlowNodeFunc(ret);
        return ret;
    };
    node.addInPort = (label:string, nodeId:string) => addInPort(node, label, nodeId);
    node.addableInPort = () => false;
};

export const setNoteNodeFunc = (node:NoteNodeType) => {
    node.clone = (id:string, position?:{x:number, y:number}) => {
        const newPosition = position? {x:position.x, y:position.y}: {x:node.position.x, y:node.position.y};
        const ret = new NoteNode(id, newPosition);
        ret.label = node.label;
        Object.assign(ret, cloneCommonNodeProps(node));
        ret.title = node.title;
        ret.content = node.content;
        ret.fontSize = node.fontSize;
        ret.color = node.color;
        setNoteNodeFunc(ret);
        return ret;
    };
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
