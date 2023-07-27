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
import { FlowType, FrameType } from 'Model/Library';
import {
  addDataDstStepAction,
  addDataSrcStepAction,
  deleteCacheAction,
  resizeInspectorAction,
  updateFlowAction
} from 'Modules/flowEditor';

type InspectorProps = {
  inspector: { width: number };
  flow: FlowType;
  selected_step_ids: Array<string>;
  nodes: any[];
  runnables: RunnablesType;
  // selected_data_source_detail: FrameType;
  selectedFrameState: [FrameType|undefined, (value:React.SetStateAction<FrameType|undefined>)=>void];
  lockUUID: string | undefined;
  // updateDataFrameDetail: Function
  addStep: Function;
  selectSteps: Function;
  refreshFlow: Function;
  deleteSteps: Function;
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
        dispatch(addDataDstStepAction(dataDst, selectedDataNodeId));
    };
    const addDataSrcStep = (dataSrc: any) => {
        dispatch(addDataSrcStepAction(dataSrc));
    };
    const updateFlow = (flow) => {
        dispatch(updateFlowAction(flow));
    };
    const deleteCache = (selected_step_id: string) => {
        dispatch(deleteCacheAction(selected_step_id));
    };
    const resizeInspector = (width: number) => {
        dispatch(resizeInspectorAction(width));
    };


    const { selected_step_ids, lockUUID, nodes, runnables, flow,
      inspector, addFlowVariableHidden, commandSelectorHidden, baseInspectorDisabled,
      previewDisabled, addStep,updateStep,selectSteps,addHistory,
      selectedFrameState, deleteSteps,refreshFlow,updateLastSavedFlow } = props

    let property

    const selected_step = GraphUtil.getNode(nodes, selected_step_ids[0])


    if (selected_step_ids.length === 1) {
      if (selected_step_ids[0] === 'flow') {
        property = <FlowSettingsInspector
          runnables={runnables}
          selected_step_ids={selected_step_ids}
          // nodes={flow.flow.nodes}
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
        if (selected_step instanceof DataFrameStepModel) {
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
            selected_step_ids={selected_step_ids}
            deleteCache={deleteCache}
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
            selected_step_ids={selected_step_ids}
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
            selected_step_ids={selected_step_ids}
            baseInspectorDisabled={baseInspectorDisabled}

            updateStep={updateStep}
            addHistory={addHistory}
            selectSteps={selectSteps}
            deleteSteps={deleteSteps}
            parentUUID={flow.folderUuid || undefined}
          />
        } else if (selected_step instanceof CommandStepModel) {
          property = <CommandInspector
            selected_step_ids={selected_step_ids}
            // runnables={runnables}
            nodes={nodes}
            updateStep={updateStep}
            addHistory={addHistory}
            selectSteps={selectSteps}
            deleteSteps={deleteSteps}
            baseInspectorDisabled={baseInspectorDisabled}
          />
        } else if (selected_step instanceof NoteStepModel) {
          property = <NoteInspector
            selected_step_ids={selected_step_ids}
            nodes={nodes}
            addHistory={addHistory}
            selectSteps={selectSteps}
            updateStep={updateStep}
            deleteSteps={deleteSteps}
            baseInspectorDisabled={baseInspectorDisabled} />
        }
      }
    } else if (!selected_step_ids.length) {
      property = <FlowSettingsInspector
        // nodes={flow.flow.nodes}
        runnables={runnables}
        selected_step_ids={selected_step_ids}
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
        selected_step_ids={selected_step_ids}
        addStep={addStep}
        addDataSrcStep={addDataSrcStep}
        addDataDstStep={addDataDstStep}
        addHistory={addHistory}
        baseInspectorDisabled={baseInspectorDisabled}
        commandSelectorHidden={commandSelectorHidden}
      />
    }

    return <React.Fragment>
      <Resizer
        inspector={inspector}
        resizeInspector={resizeInspector}>
        <AsyncResourceContent fallback={<p>Loading...</p>}>
          {property}
        </AsyncResourceContent>
      </Resizer>
    </React.Fragment>

};
