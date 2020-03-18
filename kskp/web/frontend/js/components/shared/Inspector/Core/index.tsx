import React from 'react'
import {
  CommandInspector,
  DataSourceInspector,
  FlowSettingsInspector,
  MultiInspector,
  NoteInspector,
  Resizer
} from 'Shared/Inspector'
import classnames from 'classnames'
import style from '../style.scss'
import { FlowEditorProps } from 'FlowEditorContainer/index'
import { CommandStepModel, DataFrameStepModel, NoteStepModel } from 'Model/index'
import { GraphUtil } from 'Utils/index'
import { DataFrameDetailType, MastType } from "Types/index";
import { FlowModelProps } from "Model/Flow/FlowModel";

type InspectorProps = {
  inspector: {width:number};
  flow: FlowModelProps;
  selected_step_ids: Array<string>;
  nodes: [];
  mast: MastType;
  selected_tab_id: string;
  selected_data_source_detail: DataFrameDetailType;
  lockUUID: string;
  updateDataFrameDetail: Function
  addStep: Function;
  selectSteps: Function;
  updateFlow: Function;
  notify: Function;
  dismissNotify: Function;
  loadFlowJSON: Function;
  deleteSteps: Function;
  addHistory: Function;
  deleteCache: Function;
  updateStep: Function;
  sortStepSrcEnd: Function;
  resizeInspector:Function;
}

class Inspector extends React.Component<InspectorProps> {

  render() {
    let { selected_step_ids, lockUUID, nodes, mast, addStep, selectSteps, flow,
      updateFlow, notify, dismissNotify, selected_data_source_detail, updateDataFrameDetail,
      loadFlowJSON, deleteSteps, addHistory, deleteCache, updateStep, sortStepSrcEnd,
      resizeInspector, inspector } = this.props

    let property

    if (selected_step_ids.length === 1) {
      if (selected_step_ids[0] === 'flow') {
        property = <FlowSettingsInspector
          mast={mast}
          selected_step_ids={selected_step_ids}
          addStep={addStep}
          selectSteps={selectSteps}
          flow={flow}
          updateFlow={updateFlow}
          addHistory={addHistory}
        />
      } else {
        const selected_step = GraphUtil.getNode(nodes, selected_step_ids[0])
        if (selected_step instanceof DataFrameStepModel) {
          property = <DataSourceInspector
            nodes={nodes}
            notify={notify}
            dismissNotify={dismissNotify}
            selected_data_source_detail={selected_data_source_detail}
            updateDataFrameDetail={updateDataFrameDetail}
            mast={mast}
            lockUUID={lockUUID}
            loadFlowJSON={loadFlowJSON}
            deleteSteps={deleteSteps}
            selectSteps={selectSteps}
            addHistory={addHistory}
            flow={flow}
            updateFlow={updateFlow}
            selected_step_ids={selected_step_ids}
            deleteCache={deleteCache}
            addStep={addStep}
            updateStep={updateStep}
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
          />
        } else if (selected_step instanceof NoteStepModel) {
          property = <NoteInspector
            selected_step_ids={selected_step_ids}
            nodes={nodes}
            selectSteps={selectSteps}
            updateStep={updateStep}
            deleteSteps={deleteSteps}
          />
        }
      }
    } else if (!selected_step_ids.length) {
      property = <FlowSettingsInspector
        mast={mast}
        selected_step_ids={selected_step_ids}
        addStep={addStep}
        selectSteps={selectSteps}
        flow={flow}
        updateFlow={updateFlow}
        addHistory={addHistory}
      />
    } else {
      property = <MultiInspector
        deleteSteps={deleteSteps}
        selectSteps={selectSteps}
        nodes={nodes}
        mast={mast}
        selected_step_ids={selected_step_ids}
        addStep={addStep}
        addHistory={addHistory} />
    }

    return <React.Fragment>
      <Resizer
        inspector={inspector}
        resizeInspector={resizeInspector}>
        {property}
      </Resizer>
    </React.Fragment>
  }

}

export default Inspector