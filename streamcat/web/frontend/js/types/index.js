import { CommandStepModel, DataFrameStepModel, NoteStepModel, SubflowCommandModel, SubFlowStepModel } from 'Model/index'
import React from 'react'
import CommandModel from 'Model/Command/CommandModel'

export type StepModelType = CommandStepModel | SubFlowStepModel | DataFrameStepModel | NoteStepModel
export type CommandParamType = {
  label: string;
  name: string;
  optional?: boolean;
  options: any;
  type: string;
  default?: string | number;
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

export type CommandModelType = CommandModel | SubflowCommandModel;

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

export type LibraryListDataType = {
  createdAt: string;
  creator: string;
  label: string;
  type: string;
  uuid: string;
  selected: boolean;
}

export type UploadedFileType = {
  file: File | null,
  uuid?: string,
  label?: string
}

export type MastType =  {
  commands: any[],
  subflows: any[],
  visualizers: any[]
}

export type HistoryType = {
  current: number,
  nodes: []
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

export type ToolBarButtonType = {
  onClick: Function;
  children: React.ReactNode;
  disabled: boolean;
  icon: string;
  is_paper_toolbar_button: boolean;
  style: object;
}

export type ZoomToolBarButtonType = {
  onClickZoomIn: Function;
  onClickZoomOut: Function;
  onClickDefaultZoom: Function;
  disabled: boolean;
  zoom: number;
}

export type DownloadButtonType = {
  onClick: Function;
  children: React.ReactChildren;
  disabled: boolean;
  icon: string;
  danger: boolean;
  href: string;
  download: string;
}

export type RunArgsType = {
  flowUuid: string;
  flows: [];
  variables: [];
}

export type GraphType = {
  width: number;
  height: number;
  edges: any[];
  nodes: any[];
}

export type dropDownListItem = {
  label: string,
  value: string,
  object?: {}
}

export interface TableCell {
  selected?: boolean;
}

export interface UserRole {
  uuid:       string;
  name:       string;
  systemRole: string;
  creator:    string;
  createdAt:  Date;
}

export interface UserProject {
  uuid:      string;
  type:      string;
  label:     string;
  creator:   string;
  createdAt: Date;
}

export interface IFilterCategoryItem {
  id: string;
  label: string;
  multiple: boolean;
  data: IFilterListItem[];
  disabled?: boolean;
}

export interface IFilterListItem {
  id: string;
  label: string;
  selected: boolean;
}