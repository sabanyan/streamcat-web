import { Command, Flow } from 'Model/Library';
import { StringUtil } from 'Utils/index';
import {
    setCommandNodeFunc,
    setFlowNodeFunc,
    setFrameNodeFunc,
    setNoteNodeFunc
} from 'Api';

export type NodeType = {
    readonly id: string;
    label?: string | null;
    readonly type: 'frame' | 'store' | 'int' | 'command' | 'flow' | 'note';
    position: { x:number, y:number };
    size?: { width:number, height:number };
    error?: {};
    invalid?: {};
    clone: <TNodeType=NodeType>(id:string, position?:{x:number, y:number}) => TNodeType;
};
    
export type FrameNodeType = NodeType & {
    uuid?: string | null;
    value?: any;
    makeCache?: boolean;
    dataSource?: string;
    cacheCreatedAt?: string | null;
    hasData: () => boolean;
    isCached: () => boolean;
    deleteCache: () => void;
};

export type CommandNodeType = NodeType & {
    commandId: string;
    args?: { [name:string]:any };
    srcs?: { [port:string]:string };
    dsts?: { [port:string]:string };
    srcsOrder?: string[];
    deleteInPort: (label:string) => void;
    addInPort: (label:string, nodeId:string) => void;
    getInPortIndex: () => number;
    addableInPort: (command: Command) => boolean;
};

export type BaseFlowNodeType = NodeType & {
    classification?: string
    args?: { [name:string]:any };
    srcs?: { [port:string]:string };
    dsts?: { [port:string]:string };
    srcsOrder?: string[];
    masked?: boolean;
    addInPort: (label:string, nodeId:string) => void;
    addableInPort: () => boolean;
};

export type FlowNodeType = BaseFlowNodeType & {
    uuid: string | null;
};

export type InlineFlowNodeType = BaseFlowNodeType & {
    flow: Flow & {
        creator: string;
        createdAt: string;
    };
};

export type NoteNodeType = NodeType & {
    title: string;
    content?: string;
    fontSize?: number;
    color?: string;
    setTitle: (title:string) => void;
    setFontSize: (fontSize:number) => void;
};

export const FrameNode = function(this: FrameNodeType, id:string, position:{x:number, y:number}) {
    (this as any).id = id;
    (this as any).type = 'frame';
    this.label = id;
    this.position = position;
    this.size = {width:38, height:38};
    this.error = {};
    this.invalid = {};
    this.uuid = null;
    this.makeCache = false;
    this.dataSource = 'csv';
    this.cacheCreatedAt = null;
    setFrameNodeFunc(this);
};

export const CommandNode = function(this: CommandNodeType, id:string, commandId:string, position:{x:number, y:number}) {
    (this as any).id = id;
    (this as any).type = 'command';
    this.label = id;
    this.position = position;
    this.size = {width:38, height:38};
    this.error = {};
    this.invalid = {};
    this.commandId = commandId;
    this.args = {};
    this.srcs = {};
    this.dsts = {};
    this.srcsOrder =[];
    setCommandNodeFunc(this);
};

export const FlowNode = function(this: FlowNodeType, id:string, uuid:string|null, position:{x:number, y:number}) {
    (this as any).id = id;
    (this as any).type = 'flow';
    this.label = id;
    this.position = position;
    this.size = {width:38, height:38};
    this.error = {};
    this.invalid = {};
    this.uuid = uuid;
    this.args = {};
    this.srcs = {};
    this.dsts = {};
    this.srcsOrder = [];
    setFlowNodeFunc(this);
};

export const InlineFlowNode = function( this: InlineFlowNodeType,
                                        id: string, 
                                        classification: string|undefined,
                                        flow:Flow & {creator:string; createdAt:string;},
                                        position:{x:number, y:number}) {
    (this as any).id = id;
    (this as any).type = 'flow';
    this.classification = classification;
    this.label = id;
    this.position = position;
    this.size = {width:38, height:38};
    this.error = {};
    this.invalid = {};
    this.flow = flow;
    this.args = {};
    this.srcs = {};
    this.dsts = {};
    this.srcsOrder = [];
    setFlowNodeFunc(this);
};

export const NoteNode = function(this:NoteNodeType, id:string, position:{x:number, y:number}){
    (this as any).id = id;
    (this as any).type = 'note';
    this.label = '';
    this.position = position;
    this.size = {width:200, height:40};
    this.error = {};
    this.invalid = {};
    this.title = '新しいメモ';
    this.content = '';
    this.fontSize = 16;
    this.color = 'green';
    setNoteNodeFunc(this);
};

export const addInPort = (self:any, label:string, nodeId:string) => {
    if(!self.srcs){
        self.srcs = {};
    }
    self.srcs[label] = nodeId;
    if(!self.srcsOrder){
        self.srcsOrder = [];
    }
    self.srcsOrder.push(label);
};

export const calcSize = (title:string, fontSize:number) => {
    const width = StringUtil.getTextWidth(title, fontSize) + 15;
    const minWidth = 88;
    return {
        width: minWidth < width? width: minWidth,
        height: fontSize + 15
    };
};
