//@flow
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
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import { CommandStepModel, DataFrameStepModel, NoteStepModel } from 'Model/index'
import { GraphUtil } from 'Utils/index'
import type { DataFrameDetailType, MastType } from "Types/index";
import type { FlowModelProps } from "Model/Flow/FlowModel";

type InspectorProps = {
    selected_step_ids: [];
    nodes: [];
    mast: MastType;
    selected_tab_id: string;
    addStep:Function;
    selectSteps:Function;
    flow:FlowModelProps;
    updateFlow:Function;
    notify:Function;
    dismissNotify:Function;
    selected_data_source_detail:DataFrameDetailType;
    loadFlowJSON:Function;
    deleteSteps:Function;
    addHistory:Function;
    deleteCache:Function;
    updateStep:Function;
    sortStepSrcEnd:Function;
    POST_VIZS_FROM_FLOW:Function;
}

class Inspector extends React.Component<InspectorProps> {

  render () {
      let {selected_step_ids, locks, nodes, mast, addStep, selectSteps, flow, 
        updateFlow, notify, dismissNotify, selected_data_source_detail, updateDataFrameDetail, 
        loadFlowJSON, deleteSteps, addHistory, deleteCache, updateStep, sortStepSrcEnd, POST_VIZS_FROM_FLOW} = this.props

      let property

      if (selected_step_ids.length == 1) {
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
              locks={locks}
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
              POST_VIZS_FROM_FLOW={POST_VIZS_FROM_FLOW}
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
          addHistory={addHistory}/>
    }
    return <Resizer>
      {property}
    </Resizer>
  }

}

export default Inspector