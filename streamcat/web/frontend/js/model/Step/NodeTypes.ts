import { Flow } from 'Model/Library';

export type NodeType = {
    readonly id: string;
    label?: string | null;
    readonly type: 'frame' | 'store' | 'int' | 'command' | 'flow' | 'note';
    position?: { x:number, y:number };
    size?: { width:number, height:number };
    error?: {};
    invalid?: {};
};
    
export type FrameNodeType = NodeType & {
    uuid?: string|null
    value?: any
    makeCache?: boolean;
    dataSource?: string;
    cacheCreatedAt?: string;
    hasData: () => boolean;
    isCached: () => boolean;
    deleteCache: () => void;
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
    readonly title: string;
    content?: string;
    readonly fontSize?: number;
    color?: string;
    setTitle: (title:string) => void;
    setFontSize: (fontSize:number) => void;
};
