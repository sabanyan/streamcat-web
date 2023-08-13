import { Command, Flow, FlowCommand } from 'Model/Library';
import { StringUtil } from 'Utils/index';

export type NodeType = {
    readonly id: string;
    label?: string | null;
    readonly type: 'frame' | 'store' | 'int' | 'command' | 'flow' | 'note';
    position: { x:number, y:number };
    size?: { width:number, height:number };
    error?: {};
    invalid?: {};
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
    getCommand: (commands: Command[]) => Command | null;
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
    getCommand: (subflows: FlowCommand[]) => FlowCommand | null;
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
    this.hasData = () => !!this.uuid;
    this.isCached = () => !!this.cacheCreatedAt;
    this.deleteCache = () => {
        this.cacheCreatedAt = null;
        this.uuid = null;
    };
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
    this.deleteInPort = (label:string) => {
        this.srcs && delete this.srcs[label];
        if(this.srcsOrder){
            this.srcsOrder = this.srcsOrder.filter(srcLabel => srcLabel !== label);
        }
    };
    this.addInPort = (label:string, nodeId:string) => addInPort(this, label, nodeId);
    this.getInPortIndex = () => {
        const srcKeys = Object.keys(this.srcs || {});

        const filterKeys = srcKeys.filter((key) => {
            return (key.indexOf("*") != -1);
        });

        let max = 0;
        filterKeys.forEach((key) => {
            const value = key.replace("*", "");
            max = (parseInt(value) > max) ? parseInt(value) : max;
        });

        return max;
    };
    this.addableInPort = (command: Command) => {
        // コマンドが複数入力可能かどうかを判断するため、元のコマンドのInPort定義に＊があるか確認する
        const filterKeys = command.ports[0].filter((inPort) => {
            return (inPort.label.indexOf("*") >= 0);
        });
        return filterKeys.length > 0;
    };
    this.getCommand = (commands: Command[]) => {
        // const commands = (window as any).commands;
        return commands.find(command => command.id === this.commandId) || null;
    };
};

export const FlowNode = function(this: FlowNodeType, id:string, uuid:string, position:{x:number, y:number}) {
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
    this.addInPort = (label:string, nodeId:string) => addInPort(this, label, nodeId);
    this.getCommand = (subflows: FlowCommand[]) => {
        // const subflows = (window as any).subflows;
        return subflows.find(subflow => subflow.uuid === this.uuid) || null;
    };
    this.addableInPort = () => false;
};

export const InlineFlowNode = function( this: InlineFlowNodeType,
                                        id: string, 
                                        classification: string,
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
    this.addableInPort = () => false;
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
    this.setTitle = (title:string) => {
        this.title = title;
        this.size = calcSize(title, this.fontSize || 16);
    };
    this.setFontSize = (fontSize:number) => {
        this.fontSize = fontSize;
        this.size = calcSize(this.title, fontSize);
    };
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
