
import React, { useMemo } from 'react';
import ReactFlow, { Edge, MarkerType } from 'reactflow';
import GraphUtil from 'Utils/GraphUtil';
import { AllNodeType } from 'Model/Library';
import { BaseFlowNodeType, CommandNodeType } from 'Model/Node/NodeTypes';
import { CircleNode } from '../CircleNode';
import { RectNode } from '../RectNode';

type Props = {
    nodes: AllNodeType[];
};

export const Canvas = (props:Props) => {
    /**
     * NodeからPortへのEdgeを作成する
     */
    const createEdges = (nodeId:string, ports?:{[port: string]: string}, reverse:boolean=false) => {
        const edges:Edge[] = [];
        ports && Object.entries(ports).forEach(([portLabel,targetNodeId]) => {
            if(targetNodeId){
                if(reverse){
                    // Edgeの方向を逆にする
                    [nodeId,targetNodeId] = [targetNodeId,nodeId];
                }
                // Edgeのidを作成する
                const edgeId = GraphUtil.edgeName(nodeId, targetNodeId, portLabel);
                edges.push({
                    id: edgeId,
                    source: nodeId,
                    target: targetNodeId,
                    // 終端を矢印にする
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 16,
                        height: 16,
                        // color: '#FF0072',
                    },
                    // 線幅
                    style: {
                        strokeWidth: 2,
                        // stroke: '#FF0072',
                    }
                });
            }
        })
        return edges;
    };

    const createPortLabels = (ports?:{[port: string]: string}) => {
        return ports? Object.keys(ports): [];
    };

    let edges:Edge[] = [];

    /**
     * Canvasに表示するNodeとEdgeオブジェクトを作成する
     */
    const nodes = props.nodes.map(node => {
        let iPortLabels:string[] = [];
        let oPortLabels:string[] = [];

        if(node.type==='command' || node.type==='flow'){
            const runableNode = node as CommandNodeType | BaseFlowNodeType;
            // 入力PortからEdgeを作成する
            edges = edges.concat(
                createEdges(runableNode.id, runableNode.srcs, true)
            );
            // 出力PortからEdgeを作成する
            edges = edges.concat(
                createEdges(runableNode.id, runableNode.dsts)
            );
            // Portラベルの配列を作成する
            iPortLabels = createPortLabels(runableNode.srcs);
            oPortLabels = createPortLabels(runableNode.dsts);
        }

        return {
            id: node.id,
            // type=frameの場合は丸型Nodeにする
            type: node.type==='frame'? 'circle': 'rect',
            // Nodeコンポーネントに渡す値
            data: {
                label: node.label,
                iPortLabels: iPortLabels,
                oPortLabels: oPortLabels
            },
            position: node.position,
        };
    });

    // typeに対するNodeコンポーネントを設定する
    const nodeTypes = useMemo(() => ({ circle: CircleNode, rect: RectNode }), []);

    return <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
            nodeTypes={nodeTypes} 
            nodes={nodes}
            edges={edges}
        />
        {/* <Background /> */}
        {/* <Controls /> */}
    </div>;
};
