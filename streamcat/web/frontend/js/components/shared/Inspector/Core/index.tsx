import React from 'react'
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
import { FlowUtil } from 'Utils/index'
import { GraphType, RunnablesType } from "Types/index";
import { AllNodeType, Command, Flow, FlowCommand, FlowType, InlineFlowCommand } from 'Model/Library';
import {
  addDataDstNodeAction,
  addDataSrcNodeAction,
  graphUtil,
} from 'Modules/flowEditor';
import { FrameNodeType, InlineFlowNodeType } from 'Model/Node/NodeTypes';

type InspectorProps = {
  inspectorWidthState: [number, (value:React.SetStateAction<number>)=>void];
  flowData: Flow;
  flowState: [FlowType, (value:React.SetStateAction<FlowType>)=>void];
  graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
  lastSavedFlow?: FlowType;
  selectedNodes: AllNodeType[];
  // nodes: AllNodeType[];
  runnables: RunnablesType;
  // selected_data_source_detail: FrameType;
  // selectedFrameState: [FrameType|undefined, (value:React.SetStateAction<FrameType|undefined>)=>void];
  lockUUID: string | undefined;
  // updateDataFrameDetail: Function
  zoom: number
  addNode: (addNode:AllNodeType, srcNodes:AllNodeType[], dstNodes:AllNodeType[], zoom:number) => void;
  selectNodes: (selectedNodes: AllNodeType[]) => void;
  // refreshFlow: (context: FlowType) => void;
  deleteNodes: (nodes: AllNodeType[]) => void;
  addHistory: () => void;
  updateNode: (node:AllNodeType) => void;
  // updateNodeEdges: (node:AllNodeType) => void;
  updateLastSavedFlow: (lastSavedFlow:FlowType) => void;
  addFlowVariableHidden: boolean;
  previewDisabled: boolean;
  commandSelectorHidden: boolean;
  baseInspectorDisabled: boolean;
}

export const Inspector = (props:InspectorProps) => {
    const {flowData} = props;

    const [flow, setFlow] = props.flowState;
    const [graph, setGraph] = props.graphState;


    const addDataDstNode = (dataDst: Command | FlowCommand | InlineFlowCommand, selectedDataNodeId: string) => {
        addDataDstNodeAction(flowData, dataDst, selectedDataNodeId);
        setFlow({...flow});
        setGraph(graphUtil.getGraph(flowData.nodes, zoom));
    };
    const addDataSrcNode = (dataSrc: Command | FlowCommand | InlineFlowCommand) => {
        addDataSrcNodeAction(flowData, dataSrc);
        setFlow({...flow});
        setGraph(graphUtil.getGraph(flowData.nodes, zoom));
    };
    const updateFlow = (flowData:Flow, zoom:number) => {
        // dispatch(updateFlowAction(flowData, zoom));
        setFlow({...flow});
        setGraph(graphUtil.getGraph(flowData.nodes, zoom));
    };
    const deleteCache = (node:AllNodeType) => {
        if (node.type === 'frame') {
          (node as FrameNodeType).deleteCache();
          setFlow({...flow});
        }
    };
    // const resizeInspector = (width: number) => {
    //     dispatch(resizeInspectorAction(width));
    // };


    const { selectedNodes, lockUUID, runnables, lastSavedFlow,
      addFlowVariableHidden, commandSelectorHidden, baseInspectorDisabled,
      previewDisabled, zoom, addNode,updateNode,selectNodes,addHistory,
      deleteNodes,updateLastSavedFlow } = props

    let property

    if(!flowData){
      // flowが読み込まれていない場合は何も表示しない
      return <></>;
    }else if(selectedNodes.length === 0){
      // Nodeを選択していない場合
      property = <FlowSettingsInspector
        key={lastSavedFlow?.uuid || ''}
        // nodes={flow.flow.nodes}
        runnables={runnables}
        selectedNodes={selectedNodes}
        zoom={zoom}
        addNode={addNode}
        addDataSrcNode={addDataSrcNode}
        addDataDstNode={addDataDstNode}
        selectNodes={selectNodes}
        flowData={flowData}
        flowUuid={lastSavedFlow?.uuid || ''}
        updateFlow={updateFlow}
        addHistory={addHistory}
        addFlowVariableHidden={addFlowVariableHidden}
        commandSelectorHidden={commandSelectorHidden}
        baseInspectorDisabled={baseInspectorDisabled}
      />
    }else if(selectedNodes.length > 1){
      // 複数のNodeを選択している場合
      property = <MultiInspector
        key={selectedNodes.join(',')}
        deleteNodes={deleteNodes}
        selectNodes={selectNodes}
        nodes={flowData.nodes}
        runnables={runnables}
        selectedNodes={selectedNodes}
        zoom={zoom}
        addNode={addNode}
        addDataSrcNode={addDataSrcNode}
        addDataDstNode={addDataDstNode}
        addHistory={addHistory}
        baseInspectorDisabled={baseInspectorDisabled}
        commandSelectorHidden={commandSelectorHidden}
      />
    }else if(FlowUtil.NodeExists(flowData.nodes, selectedNodes[0].id)){
      // 一つのNodeを選択している場合
      const selectedNode = selectedNodes[0];

      if(selectedNode.type === 'frame'){
        property = <DataFrameInspector
          key={selectedNode.id}
          // nodes={flow.nodes}
          // selected_data_source_detail={selected_data_source_detail}
          // updateDataFrameDetail={updateDataFrameDetail}
          // selectedFrameState={selectedFrameState}
          runnables={runnables}
          lockUUID={lockUUID}
          deleteNodes={deleteNodes}
          selectNodes={selectNodes}
          addHistory={addHistory}
          flowData={flowData}
          lastSavedFlow={lastSavedFlow}
          updateFlow={updateFlow}
          selectedNodes={selectedNodes}
          deleteCache={deleteCache}
          zoom={zoom}
          addNode={addNode}
          addDataSrcNode={addDataSrcNode}
          addDataDstNode={addDataDstNode}
          updateNode={updateNode}
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
            runnables={runnables}
            selectedNode={selectedNode}
            baseInspectorDisabled={baseInspectorDisabled}
            updateNode={updateNode}
            // updateNodeEdges={updateNodeEdges}
            addHistory={addHistory}
            selectNodes={selectNodes}
            deleteNodes={deleteNodes}
            parentUUID={lastSavedFlow?.folderUuid || undefined}
          />
      }else if(selectedNode.hasOwnProperty('flow') &&
              (selectedNode as InlineFlowNodeType).classification == 'data_dest'){
          property = <DataDstInspector
            key={selectedNode.id}
            nodes={flowData.nodes}
            runnables={runnables}
            selectedNode={selectedNode}
            baseInspectorDisabled={baseInspectorDisabled}
            updateNode={updateNode}
            // updateNodeEdges={updateNodeEdges}
            addHistory={addHistory}
            selectNodes={selectNodes}
            deleteNodes={deleteNodes}
            parentUUID={lastSavedFlow?.folderUuid || undefined}
          />
      }else if(selectedNode.type === 'command' || selectedNode.type === 'flow'){
        property = <CommandInspector
          key={selectedNode.id}
          selectedNode={selectedNode}
          runnables={runnables}
          nodes={flowData.nodes}
          updateNode={updateNode}
          // updateNodeEdges={updateNodeEdges}
          addHistory={addHistory}
          selectNodes={selectNodes}
          deleteNodes={deleteNodes}
          baseInspectorDisabled={baseInspectorDisabled}
        />
      }else if(selectedNode.type === 'note'){
        property = <NoteInspector
          key={selectedNode.id}
          selectedNode={selectedNode}
          nodes={flowData.nodes}
          addHistory={addHistory}
          selectNodes={selectNodes}
          updateNode={updateNode}
          deleteNodes={deleteNodes}
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
