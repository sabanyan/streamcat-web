import { Command, FlowCommand, InlineFlowCommand } from 'Model/Library';
import {
    CommandModel,
    CommandStepModel,
    DataFrameStepModel,
    NoteStepModel,
    SubFlowStepModel,
    VisualizeModel
} from 'Model/index';

// TODO: 型指定をすると型エラーが発生するので暫定的にany型とする
// export type StepModelType = CommandStepModel | SubFlowStepModel | DataFrameStepModel | NoteStepModel;
// export type StepModelType = any;

// TODO: 型指定をすると型エラーが発生するので暫定的にany型とする
// export type CommandParamType = {
//     label: string;
//     name: string;
//     description: string;
//     optional?: boolean;
//     options: any;
//     type: string;
//     helper: any;
//     resizable: boolean;
//     isPassword: boolean;
//     default?: string | number;
//     section: string
//     elements: CommandParamType[];
// };
export type CommandParamType = any;

export type CommandPortType = {
    label: string;
    type: string;
};

export type RunnablesType =  {
    commands: Command[];
    visualizers: VisualizeModel<Command>[];
    subflows: FlowCommand[];
    datasrcs: InlineFlowCommand[];
    datadsts: InlineFlowCommand[];
};

export type HistoryType = {
    current: number;
    nodes: any[];
};

export type DragType = {
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
};

export type GraphType = {
    width: number;
    height: number;
    edges: any[];
    nodes: any[];
};

export type dropDownListItem = {
    label: string;
    value: string;
    object?: {};
};
