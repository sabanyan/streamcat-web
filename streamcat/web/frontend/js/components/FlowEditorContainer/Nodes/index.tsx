import React from 'react';
import { AllNodeType, FlowType } from 'Model/Library';
import { DragType, GraphType, RunnablesType } from 'Types/index';
import { Node } from 'Shared/SVG';

type Props = {
    selectedNodes: AllNodeType[];
    nodeReadOnly: boolean;
    zoom: number;
    runnables: RunnablesType;
    flowState: [FlowType, (value:React.SetStateAction<FlowType>)=>void];
    graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    dragRangeState: [DragType|null, (value:React.SetStateAction<DragType|null>)=>void];
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    addSelectNode: (selectedNode: AllNodeType) => void;
    unselectNode: (selectedNodeId: string) => void;
    addHistory: () => void;
};

export const Nodes = (props:Props) => {
    const {
        selectedNodes,
        nodeReadOnly,
        zoom,
        runnables,
        selectNodes,
        addSelectNode,
        unselectNode,
        addHistory} = props;
    const [flow, setFlow] = props.flowState;
    const [graph, setGraph] = props.graphState;
    const [dragRange, setDragRange] = props.dragRangeState;
    
    return flow.flow.nodes.map(node => {
        let selected = (node.id === selectedNodes[0]?.id);
        return <Node
            key={node.id}
            node={node}
            position={node.position}
            selected={selected}
            invalid={node.invalid}
            error={node.error}
            runnables={runnables}
            flowData={flow.flow}
            flowState={[flow, setFlow]}
            graphState={[graph, setGraph]}
            selectedNodes={selectedNodes}
            zoom={zoom}
            dragRange={dragRange}
            addSelectNode={addSelectNode}
            unselectNode={unselectNode}
            selectNodes={selectNodes}
            // selectFrame={frame => setSelectedFrame(frame)}
            addHistory={addHistory}
            readOnly={nodeReadOnly}
        />;
    });
};
