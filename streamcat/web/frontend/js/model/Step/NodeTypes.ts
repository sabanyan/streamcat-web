import { Flow } from 'Model/Library';
import { ModelUtil, StringUtil } from 'Utils/index';

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

export const FrameNode = function(this: FrameNodeType, position:{x:number, y:number}) {
    const newId = ModelUtil.getNewId('frame');
    (this as any).id = newId;
    (this as any).type = 'frame';
    this.label = newId;
    this.position = position;
    this.size = {width:38, height:38};
    this.invalid = {};
    this.error = {};
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

export type CommandNodeType = NodeType & {
    commandId: string;
    args?: any;
    srcs?: { [port:string]:string };
    dsts?: { [port:string]:string };
    srcsOrder?: string[];
};

export type BaseFlowNodeType = NodeType & {
    masked?: boolean;
};

export type FlowNodeType = BaseFlowNodeType & {
    uuid: string | null;
};

export type InlineFlowNodeType = BaseFlowNodeType & {
    flow: Flow;
};

export type NoteNodeType = NodeType & {
    title: string;
    content?: string;
    fontSize?: number;
    color?: string;
    setTitle: (title:string) => void;
    setFontSize: (fontSize:number) => void;
};

export const calcSize = (title:string, fontSize:number) => {
    const width = StringUtil.getTextWidth(title, fontSize) + 15;
    const minWidth = 88;
    return {
        width: minWidth < width? width: minWidth,
        height: fontSize + 15
    };
};
