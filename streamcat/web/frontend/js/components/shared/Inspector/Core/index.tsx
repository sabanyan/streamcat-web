import React from 'react'
import { useDispatch } from 'react-redux';
import {AsyncResourceContent} from 'use-async-resource';
import {
  CommandInspector,
  DataFrameInspector,
  DataSrcInspector,
  DataDstInspector,
  FlowSettingsInspector,
  MultiInspector,
  NoteInspector,
  Resizer
} from 'Shared/Inspector'
import { CommandStepModel, DataFrameStepModel, NoteStepModel } from 'Model/index'
import { GraphUtil } from 'Utils/index'
import { RunnablesType } from "Types/index";
import { AllNodeType, Command, Flow, FlowCommand, FlowType, FrameType, InlineFlowCommand } from 'Model/Library';
import {
  addDataDstStepAction,
  addDataSrcStepAction,
  deleteCacheAction,
  // resizeInspectorAction,
  updateFlowAction
} from 'Modules/flowEditor';
import { InlineFlowNodeType } from 'Model/Step/NodeTypes';

type InspectorProps = {
  inspectorWidthState: [number, (value:React.SetStateAction<number>)=>void];
  flowData?: Flow;
  lastSavedFlow?: FlowType;
  selectedStepIds: string[];
  // nodes: AllNodeType[];
  runnables: RunnablesType;
  // selected_data_source_detail: FrameType;
  selectedFrameState: [FrameType|undefined, (value:React.SetStateAction<FrameType|undefined>)=>void];
  lockUUID: string | undefined;
  // updateDataFrameDetail: Function
  zoom: number
  addStep: (add_step:AllNodeType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => void;
  selectSteps: (selected_steps: any[]) => void;
  // refreshFlow: (context: FlowType) => void;
  deleteSteps: (step_ids: string[]) => void;
  addHistory: () => void;
  updateStep: (node:AllNodeType) => void;
  updateLastSavedFlow: (lastSavedFlow:FlowType) => void;
  addFlowVariableHidden: boolean;
  previewDisabled: boolean;
  commandSelectorHidden: boolean;
  baseInspectorDisabled: boolean;
}

export const Inspector = (props:InspectorProps) => {

    const dispatch = useDispatch();

    const addDataDstStep = (dataDst: Command | FlowCommand | InlineFlowCommand, selectedDataNodeId: string) => {
        dispatch(addDataDstStepAction(dataDst, selectedDataNodeId, zoom));
    };
    const addDataSrcStep = (dataSrc: Command | FlowCommand | InlineFlowCommand) => {
        dispatch(addDataSrcStepAction(dataSrc, zoom));
    };
    const updateFlow = (flowData:Flow, zoom:number) => {
        dispatch(updateFlowAction(flowData, zoom));
    };
    const deleteCache = (selected_step_id: string) => {
        dispatch(deleteCacheAction(selected_step_id));
    };
    // const resizeInspector = (width: number) => {
    //     dispatch(resizeInspectorAction(width));
    // };


    const { selectedStepIds, lockUUID, runnables, flowData, lastSavedFlow,
      addFlowVariableHidden, commandSelectorHidden, baseInspectorDisabled,
      previewDisabled, zoom, addStep,updateStep,selectSteps,addHistory,
      selectedFrameState, deleteSteps,updateLastSavedFlow } = props

    let property

    if(!flowData){
      // flowが読み込まれていない場合は何も表示しない
      return <></>;
    }else if(selectedStepIds.length === 0){
      // Nodeを選択していない場合
      property = <FlowSettingsInspector
        key={lastSavedFlow?.uuid || ''}
        // nodes={flow.flow.nodes}
        runnables={runnables}
        selectedStepIds={selectedStepIds}
        zoom={zoom}
        addStep={addStep}
        addDataSrcStep={addDataSrcStep}
        addDataDstStep={addDataDstStep}
        selectSteps={selectSteps}
        flowData={flowData}
        flowUuid={lastSavedFlow?.uuid || ''}
        updateFlow={updateFlow}
        addHistory={addHistory}
        addFlowVariableHidden={addFlowVariableHidden}
        commandSelectorHidden={commandSelectorHidden}
        baseInspectorDisabled={baseInspectorDisabled}
      />
    }else if(selectedStepIds.length > 1){
      // 複数のNodeを選択している場合
      property = <MultiInspector
        key={selectedStepIds.join(',')}
        deleteSteps={deleteSteps}
        selectSteps={selectSteps}
        nodes={flowData.nodes}
        runnables={runnables}
        selectedStepIds={selectedStepIds}
        zoom={zoom}
        addStep={addStep}
        addDataSrcStep={addDataSrcStep}
        addDataDstStep={addDataDstStep}
        addHistory={addHistory}
        baseInspectorDisabled={baseInspectorDisabled}
        commandSelectorHidden={commandSelectorHidden}
      />
    }else if(GraphUtil.NodeExists(flowData.nodes, selectedStepIds[0])){
      // 一つのNodeを選択している場合
      const selectedNode = GraphUtil.getNode(flowData.nodes, selectedStepIds[0]);

      if(selectedNode.type === 'frame'){
        property = <DataFrameInspector
          key={selectedNode.id}
          // nodes={flow.nodes}
          // selected_data_source_detail={selected_data_source_detail}
          // updateDataFrameDetail={updateDataFrameDetail}
          selectedFrameState={selectedFrameState}
          runnables={runnables}
          lockUUID={lockUUID}
          deleteSteps={deleteSteps}
          selectSteps={selectSteps}
          addHistory={addHistory}
          flowData={flowData}
          lastSavedFlow={lastSavedFlow}
          updateFlow={updateFlow}
          selectedStepIds={selectedStepIds}
          deleteCache={deleteCache}
          zoom={zoom}
          addStep={addStep}
          addDataSrcStep={addDataSrcStep}
          addDataDstStep={addDataDstStep}
          updateStep={updateStep}
          // refreshFlow={refreshFlow}
          previewDisabled={previewDisabled}
          commandSelectorHidden={commandSelectorHidden}
          baseInspectorDisabled={baseInspectorDisabled}
          updateLastSavedFlow={updateLastSavedFlow}
        />
      }else if(selectedNode.hasOwnProperty('flow') &&
              (selectedNode as InlineFlowNodeType).classification == 'data_source'){
          property = <DataSrcInspector
            key={selectedNode.id}
            nodes={flowData.nodes}
            selectedNodeId={selectedNode.id}
            baseInspectorDisabled={baseInspectorDisabled}
            updateStep={updateStep}
            addHistory={addHistory}
            selectSteps={selectSteps}
            deleteSteps={deleteSteps}
            parentUUID={lastSavedFlow?.folderUuid || undefined}
          />
      }else if(selectedNode.hasOwnProperty('flow') &&
              (selectedNode as InlineFlowNodeType).classification == 'data_dest'){
          property = <DataDstInspector
            key={selectedNode.id}
            nodes={flowData.nodes}
            selectedNodeId={selectedNode.id}
            baseInspectorDisabled={baseInspectorDisabled}
            updateStep={updateStep}
            addHistory={addHistory}
            selectSteps={selectSteps}
            deleteSteps={deleteSteps}
            parentUUID={lastSavedFlow?.folderUuid || undefined}
          />
      }else if(selectedNode.type === 'command' || selectedNode.type === 'flow'){
        property = <CommandInspector
          key={selectedNode.id}
          selectedNodeId={selectedNode.id}
          // runnables={runnables}
          nodes={flowData.nodes}
          updateStep={updateStep}
          addHistory={addHistory}
          selectSteps={selectSteps}
          deleteSteps={deleteSteps}
          baseInspectorDisabled={baseInspectorDisabled}
        />
      }else if(selectedNode.type === 'note'){
        property = <NoteInspector
          key={selectedNode.id}
          selectedNodeId={selectedNode.id}
          nodes={flowData.nodes}
          addHistory={addHistory}
          selectSteps={selectSteps}
          updateStep={updateStep}
          deleteSteps={deleteSteps}
          baseInspectorDisabled={baseInspectorDisabled} />
      }
    }else{
      // 選択中のNodeがCanvasにない場合
      // NOTE: 履歴の戻る/進むで選択中のNodeがCanvasから無くなる場合があることに留意
      return <></>;
    }

    const [inspectorWidth, setInspectorWidth] = props.inspectorWidthState;

    const resizeInspector = (inspectorWidth:number) => {
      setInspectorWidth(inspectorWidth);
    };

    return <React.Fragment>
      <Resizer
        inspectorWidth={inspectorWidth}
        resizeInspector={resizeInspector}>
        <AsyncResourceContent fallback={<p>Loading...</p>}>
          {property}
        </AsyncResourceContent>
      </Resizer>
    </React.Fragment>

};
