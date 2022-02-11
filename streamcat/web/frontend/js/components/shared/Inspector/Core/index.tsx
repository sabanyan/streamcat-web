import React from 'react'
import {SortEndHandler} from "react-sortable-hoc";
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
import { DataFrameDetailType, MastType } from "Types/index";
import { FlowType } from 'Model/Library';

type InspectorProps = {
  inspector: { width: number };
  flow: FlowType;
  selected_step_ids: Array<string>;
  nodes: [];
  mast: MastType;
  selected_tab_id: string;
  selected_data_source_detail: DataFrameDetailType;
  lockUUID: string | undefined;
  updateDataFrameDetail: Function
  addStep: Function;
  addDataSrcStep: Function;
  addDataDstStep: Function;
  selectSteps: Function;
  updateFlow: Function;
  notify: Function;
  dismissNotify: Function;
  refreshFlow: Function;
  deleteSteps: Function;
  addHistory: Function;
  deleteCache: Function;
  updateStep: Function;
  sortStepSrcEnd: SortEndHandler;
  resizeInspector: Function;
  updateLastSavedFlow: Function;
  addFlowVariableHidden: boolean;
  previewDisabled: boolean;
  commandSelectorHidden: boolean;
  baseInspectorDisabled: boolean;
}

class Inspector extends React.Component<InspectorProps> {

  render() {
    let { selected_step_ids, lockUUID, nodes, mast, addStep, addDataSrcStep, addDataDstStep, selectSteps, flow,
      updateFlow, notify, dismissNotify, selected_data_source_detail, updateDataFrameDetail,
      deleteSteps, addHistory, deleteCache, updateStep, sortStepSrcEnd, refreshFlow,
      resizeInspector, inspector, addFlowVariableHidden, commandSelectorHidden, baseInspectorDisabled,
      updateLastSavedFlow, previewDisabled } = this.props

    let property

    const selected_step = GraphUtil.getNode(nodes, selected_step_ids[0])


    if (selected_step_ids.length === 1) {
      if (selected_step_ids[0] === 'flow') {
        property = <FlowSettingsInspector
          mast={mast}
          selected_step_ids={selected_step_ids}
          nodes={flow.flow.nodes}
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
            notify={notify}
            dismissNotify={dismissNotify}
            selected_data_source_detail={selected_data_source_detail}
            updateDataFrameDetail={updateDataFrameDetail}
            mast={mast}
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

            sortStepSrcEnd={sortStepSrcEnd}
            updateStep={updateStep}
            addHistory={addHistory}
            selectSteps={selectSteps}
            deleteSteps={deleteSteps}
          />
        } else if (selected_step.flow && selected_step.classification == "data_dest") {
          property = <DataDstInspector
            nodes={nodes}
            selected_step_ids={selected_step_ids}
            baseInspectorDisabled={baseInspectorDisabled}

            sortStepSrcEnd={sortStepSrcEnd}
            updateStep={updateStep}
            addHistory={addHistory}
            selectSteps={selectSteps}
            deleteSteps={deleteSteps}
          />
        } else if (selected_step instanceof CommandStepModel) {
          property = <CommandInspector
            selected_step_ids={selected_step_ids}
            mast={mast}
            nodes={nodes}
            updateStep={updateStep}
            addHistory={addHistory}
            selectSteps={selectSteps}
            deleteSteps={deleteSteps}
            sortStepSrcEnd={sortStepSrcEnd}
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
        nodes={flow.flow.nodes}
        mast={mast}
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
        mast={mast}
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
  }

}

export {Inspector};

