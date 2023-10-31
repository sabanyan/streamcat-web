import React from 'react';
import style from "./style.scss";
import Constants from "Constants/index";
import {FlowUtil, ZoomUtil} from "Utils/index";
import { AllNodeType, FlowType } from 'Model/Library';
import {DragType, GraphType, RunnablesType} from "Types/index";
import { Edge, Selector, Shadow } from 'Shared/SVG';
import { Nodes } from '../Nodes';

type Props = {
    selectedNodes: AllNodeType[];
    readOnly: boolean;
    zoom: number;
    runnables: RunnablesType;
    dragRange: DragType|null;
    flowState: [FlowType, (value:React.SetStateAction<FlowType>)=>void];
    graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    addSelectNode: (selectedNode: AllNodeType) => void;
    unselectNode: (selectedNodeId: string) => void;
    addHistory: () => void;
};

export const Paper = (props: Props) => {
    const {
        selectedNodes,
        readOnly,
        zoom,
        runnables,
        dragRange,
        selectNodes,
        addSelectNode,
        unselectNode,
        addHistory} = props;
    const [flow, setFlow] = props.flowState;
    const [graph, setGraph] = props.graphState;

    const paperWidth = graph.width + Constants.paper.padding.right;
    const paperHeight = graph.height + Constants.paper.padding.bottom;
    const viewWidth = ZoomUtil.zoomReverse(paperWidth, zoom);
    const viewHeight = ZoomUtil.zoomReverse(paperHeight, zoom);

    if (!paperWidth || !paperHeight){
        return null;
    }

    const renderNodes = () => {
        return <Nodes
            selectedNodes={selectedNodes}
            readOnly={readOnly}
            zoom={zoom}
            runnables={runnables}
            dragRange={dragRange}
            flowState={[flow, setFlow]}
            graphState={[graph, setGraph]}
            selectNodes={selectNodes}
            addSelectNode={addSelectNode}
            unselectNode={unselectNode}
            addHistory={addHistory}
        />;
    };

    const renderEdges = () => {
        const edges:React.JSX.Element[] = [];
        if (Array.isArray(graph.edges)) {
            graph.edges.forEach((edge, index) => {
                // Nodeのsrcsまたはdstsにおいてポートに対するノードが未設定(空文字)の場合はEdgeを描画しない
                if(!edge.v || !edge.w){
                    return;
                }
                const v_node = FlowUtil.getNode(flow.flow.nodes || [], edge.v); // 入力元ノード
                const w_node = FlowUtil.getNode(flow.flow.nodes || [], edge.w); // 出力元ノード

                if (v_node && w_node) {
                    const vx = v_node.position.x +
                        Constants.default.datasource.width / 2;
                    const vy = v_node.position.y +
                        Constants.default.datasource.height / 2;
                    const wx = w_node.position.x +
                        Constants.default.operator.width / 2;
                    const wy = w_node.position.y +
                        Constants.default.operator.height / 2;
                    let outPortLabel; // 入力元ノードからの出力ポートラベル
                    let inPortLabel;  // 出力元ノードからの入力ポートラベル
                    //出力先ノードがDataFrameの場合のみ出力もとにラベルを付与する
                    if (w_node.type === 'frame') {
                        outPortLabel = JSON.parse(edge.name).port_name;
                    }
                    //入力元ノードがDataFrameの場合のみ出力もとにラベルを付与する
                    if (v_node.type === 'frame') {
                        inPortLabel = JSON.parse(edge.name).port_name;
                    }

                    const e = <Edge outPortLabel={outPortLabel} inPortLabel={inPortLabel} vx={vx} vy={vy} wx={wx} wy={wy}
                        key={index} />;
                    edges.push(e);
                }
            });
        }
        return edges;
    };

    const renderSelector = () => {
        let selector: any = null;
        if(dragRange!==null){
            selector = <Selector sx={ZoomUtil.zoomReverse(dragRange.start.x, zoom)}
                sy={ZoomUtil.zoomReverse(dragRange.start.y, zoom)}
                ex={ZoomUtil.zoomReverse(dragRange.end.x, zoom)}
                ey={ZoomUtil.zoomReverse(dragRange.end.y, zoom)} />;
        }
        return selector;
    };

    return <svg className={style.paper} width={paperWidth} height={paperHeight}
                viewBox={"0 0 " + viewWidth + " " + viewHeight}>
        <Shadow /> 
        {renderEdges()}
        {renderNodes()}
        {renderSelector()} 
    </svg>;
};
