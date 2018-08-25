//@flow
import CommandStepModel from '../model/Step/CommandStepModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import * as React from 'react'

export type StepModelType = CommandStepModel|SubFlowStepModel|DataFrameStepModel
export type CommandParamType = {
  label: string;
  name: string;
  type: string;
}

export type SubFlowParamType = {
  name: string;
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