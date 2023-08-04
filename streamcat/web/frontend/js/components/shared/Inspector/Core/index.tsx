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
import { AllNodeType, FlowType, FrameType } from 'Model/Library';
import {
  addDataDstStepAction,
  addDataSrcStepAction,
  deleteCacheAction,
  // resizeInspectorAction,
  updateFlowAction
} from 'Modules/flowEditor';

type InspectorProps = {
  inspectorWidthState: [number, (value:React.SetStateAction<number>)=>void];
  flow: FlowType;
  selectedStepIds: string[];
  nodes: any[];
  runnables: RunnablesType;
  // selected_data_source_detail: FrameType;
  selectedFrameState: [FrameType|undefined, (value:React.SetStateAction<FrameType|undefined>)=>void];
  lockUUID: string | undefined;
  // updateDataFrameDetail: Function
  zoom: number
  addStep: (add_step:AllNodeType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => void;
  selectSteps: (selected_steps: any[]) => void;
  refreshFlow: Function;
  deleteSteps: (step_ids: string[]) => void;
  addHistory: Function;
  updateStep: Function;
  updateLastSavedFlow: Function;
  addFlowVariableHidden: boolean;
  previewDisabled: boolean;
  commandSelectorHidden: boolean;
  baseInspectorDisabled: boolean;
}

export const Inspector = (props:InspectorProps) => {

    const dispatch = useDispatch();

    const addDataDstStep = (dataDst: any, selectedDataNodeId: string) => {
        dispatch(addDataDstStepAction(dataDst, selectedDataNodeId, zoom));
    };
    const addDataSrcStep = (dataSrc: any) => {
        dispatch(addDataSrcStepAction(dataSrc, zoom));
    };
    const updateFlow = (flow) => {
        dispatch(updateFlowAction(flow));
    };
    const deleteCache = (selected_step_id: string) => {
        dispatch(deleteCacheAction(selected_step_id));
    };
    // const resizeInspector = (width: number) => {
    //     dispatch(resizeInspectorAction(width));
    // };


    const { selectedStepIds, lockUUID, nodes, runnables, flow,
      addFlowVariableHidden, commandSelectorHidden, baseInspectorDisabled,
      previewDisabled, zoom, addStep,updateStep,selectSteps,addHistory,
      selectedFrameState, deleteSteps,refreshFlow,updateLastSavedFlow } = props

    let property

    const selected_step = GraphUtil.getNode(nodes, selectedStepIds[0])


    if (selectedStepIds.length === 1) {
      if (selectedStepIds[0] === 'flow') {
        property = <FlowSettingsInspector
          runnables={runnables}
          selectedStepIds={selectedStepIds}
          // nodes={flow.flow.nodes}
          zoom={zoom}
          addStep={addStep}
          addDataSrcStep={addDataSrcStep}
          addDataDstStep={addDataDstStep}
          selectSteps={selectSteps}
          flow={flow}
          updateFlow={updateFlow}
          addHistory={addHistory}
          addFlowVariableHidden={addFlowVariableHidden}
          commandSelectorHidden={commandSelectorHidden}
          baseInspectorDisabled={baseInspectorDisabled}
        />
      } else if (selected_step.type === 'frame') {
        property = <DataFrameInspector
          nodes={flow.flow.nodes}
          // selected_data_source_detail={selected_data_source_detail}
          // updateDataFrameDetail={updateDataFrameDetail}
          selectedFrameState={selectedFrameState}
          runnables={runnables}
          lockUUID={lockUUID}
          deleteSteps={deleteSteps}
          selectSteps={selectSteps}
          addHistory={addHistory}
          flow={flow}
          updateFlow={updateFlow}
          selectedStepIds={selectedStepIds}
          deleteCache={deleteCache}
          zoom={zoom}
          addStep={addStep}
          addDataSrcStep={addDataSrcStep}
          addDataDstStep={addDataDstStep}
          updateStep={updateStep}
          refreshFlow={refreshFlow}
          previewDisabled={previewDisabled}
          commandSelectorHidden={commandSelectorHidden}
          baseInspectorDisabled={baseInspectorDisabled}
          updateLastSavedFlow={updateLastSavedFlow}
        />
      } else if (selected_step.flow && selected_step.classification == "data_source") {
        property = <DataSrcInspector
          nodes={nodes}
          selectedStepIds={selectedStepIds}
          baseInspectorDisabled={baseInspectorDisabled}
          updateStep={updateStep}
          addHistory={addHistory}
          selectSteps={selectSteps}
          deleteSteps={deleteSteps}
          parentUUID={flow.folderUuid || undefined}
        />
      } else if (selected_step.flow && selected_step.classification == "data_dest") {
        property = <DataDstInspector
          nodes={nodes}
          selectedStepIds={selectedStepIds}
          baseInspectorDisabled={baseInspectorDisabled}

          updateStep={updateStep}
          addHistory={addHistory}
          selectSteps={selectSteps}
          deleteSteps={deleteSteps}
          parentUUID={flow.folderUuid || undefined}
        />
      } else if (selected_step.type === 'command' || selected_step.type === 'flow') {
        property = <CommandInspector
          selectedStepIds={selectedStepIds}
          // runnables={runnables}
          nodes={nodes}
          updateStep={updateStep}
          addHistory={addHistory}
          selectSteps={selectSteps}
          deleteSteps={deleteSteps}
          baseInspectorDisabled={baseInspectorDisabled}
        />
      } else if (selected_step.type === 'note') {
        property = <NoteInspector
          selectedStepIds={selectedStepIds}
          nodes={nodes}
          addHistory={addHistory}
          selectSteps={selectSteps}
          updateStep={updateStep}
          deleteSteps={deleteSteps}
          baseInspectorDisabled={baseInspectorDisabled} />
      }

    } else if (!selectedStepIds.length) {
      property = <FlowSettingsInspector
        // nodes={flow.flow.nodes}
        runnables={runnables}
        selectedStepIds={selectedStepIds}
        zoom={zoom}
        addStep={addStep}
        addDataSrcStep={addDataSrcStep}
        addDataDstStep={addDataDstStep}
        selectSteps={selectSteps}
        flow={flow}
        updateFlow={updateFlow}
        addHistory={addHistory}
        addFlowVariableHidden={addFlowVariableHidden}
        commandSelectorHidden={commandSelectorHidden}
        baseInspectorDisabled={baseInspectorDisabled}
      />
    } else {
      property = <MultiInspector
        deleteSteps={deleteSteps}
        selectSteps={selectSteps}
        nodes={flow.flow.nodes}
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
