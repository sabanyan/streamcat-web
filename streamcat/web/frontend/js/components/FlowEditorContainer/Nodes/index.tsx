import React, { useEffect } from 'react';
import { AllNodeType, Flow, FlowType } from 'Model/Library';
import { DragType, GraphType, RunnablesType } from 'Types/index';
import { Node } from 'Shared/SVG';
import {ZoomUtil} from 'Utils/index';
import { graphUtil } from "Modules/flowEditor";
import Constants from 'Constants/index';

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

// useStateを使うと期待通り動作しないので修正
let coords: { x: number, y: number } | null = null;
let setCoords = (_coords: { x: number, y: number } | null) => {
    coords = _coords;
};

let mouseMoveEvent;
let mouseUpEvent;

export const Nodes = (props:Props) => {
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

    /**
     * 範囲選択との衝突判定
     */
    const selectorIntersect = (node:AllNodeType) => {
        const operator = {
            x: node.position.x,
            y: node.position.y,
            width: Constants.default.step.width,
            height: Constants.default.step.height
        };

        if(dragRange){
            const { start, end } = dragRange;

            //ref:http://gyabo.sakura.ne.jp/tips/rect.html

            let sx = (start.x <= end.x) ? start.x : end.x;
            let sy = (start.y <= end.y) ? start.y : end.y;
            let ex = (end.x >= start.x) ? end.x : start.x;
            let ey = (end.y >= start.y) ? end.y : start.y;

            sx = ZoomUtil.zoomReverse(sx, zoom);
            sy = ZoomUtil.zoomReverse(sy, zoom);
            ex = ZoomUtil.zoomReverse(ex, zoom);
            ey = ZoomUtil.zoomReverse(ey, zoom);

            /**
             isIntersect = (
             ((ex >= operator.x && sx <= operator.x) ||
             (ex >= operator.x + operator.width && sx <= operator.x + operator.width)) &&
             ((ey >= operator.y && sy <= operator.y) ||
             (ey >= operator.y + operator.height && sy <= operator.y + operator.height))
             )
             */
            const isIntersect = (sx <= operator.x + operator.width &&
                operator.x <= ex &&
                sy <= operator.y + operator.height &&
                operator.y <= ey);

            if (isIntersect) {
                return true;
            } else {
                return false;
            }
        }

        return isSelected(node);
    };

    const isSelected = (node:AllNodeType) => {
        let selected = false;
        selectedNodes.map(selectedNode => {
            if (selectedNode.id === node.id) {
                selected = true;
            }
        });
        return selected;
    };

    // 範囲選択されたNodeを状態変数selectedNodesに反映する
    // NOTE: 状態変数の変更はuseEffect内で行わないとReactからWarningが表示される
    useEffect(() => {
        flow.flow.nodes.forEach(node => {
            if (selectorIntersect(node)) {
                if (!isSelected(node)) {
                    addSelectNode(node);
                }

            } else {
                if (isSelected(node)) {
                    unselectNode(node.id);
                }
            }
        });
    });

    /**
     * mouse down Node選択処理
     * @param e
     */
    const onMouseDown = (node:AllNodeType, e: React.MouseEvent<SVGElement>) => {
        //mousemoveイベントでハンドリング
        // fix #195
        if (e.button === 0) onMouseLeftDown(node, e);
    };

    const onMouseLeftDown = (node:AllNodeType, e: React.MouseEvent<SVGElement>) => {
        setCoords({
            x: e.pageX,
            y: e.pageY
        });
        mouseUpEvent = (e: React.MouseEvent<SVGElement>) => handleMouseUp(node, e);
        mouseMoveEvent = (e: React.MouseEvent<SVGElement>) => handleMouseMove(node, e);
        document.addEventListener("mousemove", mouseMoveEvent, { passive: true });
        document.addEventListener("mouseup", mouseUpEvent, { passive: true });
    };

    /**
     * mouse up
     * @param e
     */
    const handleMouseUp = (node:AllNodeType, e: React.MouseEvent<SVGElement>) => {
        setCoords(null);

        //選択イベントの呼び出し
        if (e.shiftKey) {
            if (!isSelected(node)) {
                addSelectNode(node);
            } else {
                unselectNode(node.id);
            }
        } else {
            //一度選択状態をクリアする（#71）
            selectNodes([]);
            selectNodes([node]);
        }

        document.removeEventListener("mousemove", mouseMoveEvent);
        document.removeEventListener("mouseup", mouseUpEvent);

        // flowを更新する
        setFlow({...flow});
        // Undoスタックに履歴を追加する
        addHistory();
    };

    /**
     * mouse move Nodeのドラッグ処理
     * @param e
     */
    const handleMouseMove = (node:AllNodeType, e: React.MouseEvent<SVGElement>) => {
        if (readOnly) return; // 読み取り専用の場合は移動不可

        if (selectedNodes.length > 1) {
            // 複数のNodeを一括して移動させる
            onMoveNodes(node, e);
        } else {
            // 単一のNodeを移動させる
            onMoveNode(node, e);
        }
        //一時保存された位置を更新
        setCoords({
            x: e.pageX,
            y: e.pageY
        });
    };

    const calcNewPosition = (node:AllNodeType, e: React.MouseEvent<SVGElement>): { new_x: number, new_y: number } => {
        let coords_x = e.pageX;
        let coords_y = e.pageY;

        if (coords) {
            coords_x = coords.x;
            coords_y = coords.y;
        }

        //移動量から現在位置を割り出す
        const xDiff = coords_x - e.pageX;
        const yDiff = coords_y - e.pageY;
        const new_x = node.position.x - ZoomUtil.zoomReverse(xDiff, zoom);
        const new_y = node.position.y - ZoomUtil.zoomReverse(yDiff, zoom);
        return { new_x: new_x, new_y: new_y };
    };

    const moveNodes = (flowData:Flow, node:AllNodeType, x: number, y: number, selectedNodes:AllNodeType[]) => {
        // 移動距離を算出する
        const dx = (node.position.x - x);
        const dy = (node.position.y - y);

        // 選択中の全てのNodeを移動する
        // 複数のNodeを一括で移動させる場合は、そのNodeの中に自Nodeが含まれていること
        flowData.nodes.filter(node => selectedNodes.some(selectedNode => selectedNode.id===node.id)).forEach(node => {
            // Nodeの位置を変更する
            node.position.x = node.position.x - dx;
            node.position.y = node.position.y - dy;
        });

        // Canvasへ反映させる
        setGraph(graphUtil.getGraph(flowData.nodes, zoom));
    };

    const onMoveNode = (node:AllNodeType, e: React.MouseEvent<SVGElement>) => {
        const { new_x, new_y } = calcNewPosition(node, e);
        moveNodes(flow.flow, node, new_x, new_y, [node]);
    };

    const onMoveNodes = (node:AllNodeType, e: React.MouseEvent<SVGElement>) => {
        if (selectedNodes.some(selectedNode => selectedNode.id===node.id)) {
            const { new_x, new_y } = calcNewPosition(node, e);
            moveNodes(flow.flow, node, new_x, new_y, selectedNodes);
        }
    };

    return flow.flow.nodes.map(node => {
        return <Node
            key={node.id}
            node={node}
            flowIn ={flow.flow.ports[0].exists(node.id)}
            flowOut={flow.flow.ports[1].exists(node.id)}
            selected={selectorIntersect(node)}
            runnables={runnables}
            onMouseDown={onMouseDown}
        />;
    });
};
