//@flow
import CommandStepModel from '../model/Step/CommandStepModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import * as React from 'react'
import CommandModel from '../model/Command/CommandModel'

export type StepModelType = CommandStepModel|SubFlowStepModel|DataFrameStepModel|CommentStepModel
export type CommandParamType = {
  label: string;
  name: string;
  optional?: boolean;
  type: string;
}

export type SubFlowCommandParamType = {
  id: string;
  classification: string;
  createdAt: string;
  creator: string;
  description: string;
  label: string;
  nodes: [];
  params: [CommandParamType];
  ports: [CommandPortType];
  projectId: number;
  projectName: string;
  uuid: string;
}

export type CommandModelType =  CommandModel | SubflowCommandModel;

export type SubFlowParamType = {
  name: string;
  type: string;
}

export type CommandPortType = {
  name: string;
  type: string;
}

export type FlowListDataType = {
  label: string;
  nodes: [StepModelType];
  ports: [];
  projectId: number;
  uuid: string;
  creator: string;
  createdAt: string;
  description: string;
}

export type RunResponseNameType = {
  id: string,
  uuid: string
}

export type RunResponseType =  {
  name:[RunResponseNameType];
  success: boolean;
}

export type UploadedFileType = {
  file: File,
  uuid: string,
  label: string
}

export type DragType = {
  start: {
    x: number,
    y: number
  },
  end: {
    x: number,
    y: number
  }
}

export type ToolBarButtonType={
  onClick: Function;
  children: React.Node;
  disabled: boolean;
  icon: string;
  is_paper_toolbar_button: boolean;
}

export type ZoomToolBarButtonType = {
  onClickZoomIn:Function;
  onClickZoomOut:Function;
  onClickDefaultZoom:Function;
  disabled:boolean;
  zoom:number;
}

export type DownloadButtonType = {
  onClick: Function;
  children: React.Children;
  disabled: boolean;
  icon: string;
  danger: boolean;
  href: string;
  download: string;
}

export type DataFrameDetailType = {
  contents: {};
  numberOfLines: string;
  lastModifiedAt: string;
}

export type CommentDetailType = {
  
}