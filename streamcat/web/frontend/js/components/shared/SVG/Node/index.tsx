import React, { useEffect, useState } from "react";
import Constants from "Constants/index";
import { CommandIcon, ErrorIcon, FileIcon, InOutIcon, NoteIcon, Rect, SubFlowIcon, DataSrcIcon, DataDstIcon } from "Shared/SVG";
import style from "./style.scss";
import { Api } from 'Api';
import { ZoomUtil } from "Utils/index";
import { DragType, GraphType, RunnablesType } from "Types/index";
import { AllNodeType, Flow, FrameType } from "Model/Library";
import { CommandNodeType, FlowNodeType, FrameNodeType, InlineFlowNodeType, NoteNodeType } from "Model/Node/NodeTypes";
import { graphUtil } from "Modules/flowEditor";

let mouseMoveEvent;
let mouseUpEvent;

interface Props {
    node: AllNodeType;
    position: { x: number, y: number };
    selected: boolean;
    invalid?: {};
    error?: {};
    runnables: RunnablesType;
    flowData: Flow;
    graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    selectedNodeIds: string[];
    zoom: number;
    dragRange: DragType | null;
    addSelectNode: (selectedNodeId: string) => void;
    deleteSelectNode: (selectedNodeId: string) => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    selectFrame: (frame?:FrameType) => void;
    addHistory: () => void;
    readOnly: boolean;
}

// useStateを使うと期待通り動作しないので修正
let coords: { x: number, y: number } | null = null;
let setCoords = (_coords: { x: number, y: number } | null) => {
    coords = _coords;
};

export const Node = (props: Props) => {
    const { node } = props;

    const [hover, setHover] = useState<boolean>(false);

    const isSelected = () => {
        const { selectedNodeIds } = props;
        let selected = false;
        selectedNodeIds.map((id) => {
            if (id === node.id) {
                selected = true;
            }
        });
        return selected;
    };

    /**
     * mouse down Node選択処理
     * @param e
     */
    const handleMouseDown = (e: React.MouseEvent<SVGElement>) => {
        //mousemoveイベントでハンドリング
        // fix #195
        if (e.button === 0) onMouseLeftDown(e);
    };

    const onMouseLeftDown = (e: React.MouseEvent<SVGElement>) => {
        setCoords({
            x: e.pageX,
            y: e.pageY
        });
        mouseUpEvent = (e: React.MouseEvent<SVGElement>) => handleMouseUp(e);
        mouseMoveEvent = (e: React.MouseEvent<SVGElement>) => handleMouseMove(e);
        document.addEventListener("mousemove", mouseMoveEvent, { passive: true });
        document.addEventListener("mouseup", mouseUpEvent, { passive: true });
    };

    /**
     * mouse up
     * @param e
     */
    const handleMouseUp = (e: React.MouseEvent<SVGElement>) => {
        setCoords(null);

        const { addSelectNode, deleteSelectNode, selectNodes, selectFrame, addHistory } = props;
        //選択イベントの呼び出し
        if (e.shiftKey) {
            if (!isSelected()) {
                addSelectNode(node.id);
            } else {
                deleteSelectNode(node.id);
            }
        } else {
            //一度選択状態をクリアする（#71）
            selectNodes([]);
            selectNodes([node]);

            //データフレームの詳細を取得する
            const selectedNode: AllNodeType = node;//this.getSelectedStep()
            if (selectedNode.type === 'frame') {
                const frameNode = selectedNode as FrameNodeType;
                if (frameNode.hasData() && frameNode.uuid) {
                    //TODO 将来的にはページングなどの対応が必要
                    Api.findFrame(frameNode.uuid).then(frame => {
                        selectFrame(frame);
                    });
                } else {
                    selectFrame();
                }
            } else {
                selectFrame();
            }
        }

        document.removeEventListener("mousemove", mouseMoveEvent);
        document.removeEventListener("mouseup", mouseUpEvent);

        // Undoスタックに履歴を追加する
        addHistory();
    };

    /**
     * mouse move Nodeのドラッグ処理
     * @param e
     */
    const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
        const { selectedNodeIds, readOnly } = props;
        if (readOnly) return; // 読み取り専用の場合は移動不可

        if (selectedNodeIds.length > 1) {
            // 複数のNodeを一括して移動させる
            onMoveNodes(e);
        } else {
            // 単一のNodeを移動させる
            onMoveNode(e);
        }
        //一時保存された位置を更新
        setCoords({
            x: e.pageX,
            y: e.pageY
        });
    };

    const calcNewPosition = (e: React.MouseEvent<SVGElement>): { new_x: number, new_y: number } => {
        const { zoom, position } = props;
        let coords_x = e.pageX;
        let coords_y = e.pageY;

        if (coords) {
            coords_x = coords.x;
            coords_y = coords.y;
        }

        //移動量から現在位置を割り出す
        const xDiff = coords_x - e.pageX;
        const yDiff = coords_y - e.pageY;
        const new_x = position.x - ZoomUtil.zoomReverse(xDiff, zoom);
        const new_y = position.y - ZoomUtil.zoomReverse(yDiff, zoom);
        return { new_x: new_x, new_y: new_y };
    };

    const moveNodes = (flowData:Flow, x: number, y: number, selectedNodeIds:string[]) => {
        const [graph, setGraph] = props.graphState;
        const { zoom } = props;

        // 移動距離を算出する
        const dx = (node.position.x - x);
        const dy = (node.position.y - y);

        // 選択中の全てのNodeを移動する
        // 複数のNodeを一括で移動させる場合は、そのNodeの中に自Nodeが含まれていること
        flowData.nodes.filter(node => selectedNodeIds.includes(node.id)).forEach(node => {
            // Nodeの位置を変更する
            node.position.x = node.position.x - dx;
            node.position.y = node.position.y - dy;
        });

        // Canvasへ反映させる
        setGraph(graphUtil.getGraph(flowData.nodes, zoom));
    };

    const onMoveNode = (e: React.MouseEvent<SVGElement>) => {
        const { new_x, new_y } = calcNewPosition(e);
        moveNodes(flowData, new_x, new_y, [node.id]);
    };

    const onMoveNodes = (e: React.MouseEvent<SVGElement>) => {
        const { selectedNodeIds } = props;
        if (selectedNodeIds.includes(node.id)) {
            const { new_x, new_y } = calcNewPosition(e);
            moveNodes(flowData, new_x, new_y, selectedNodeIds);
        }
    };

    /**
     * mouse over ホバー処理
     * @param e
     */
    const handleMouseOver = () => {
        //SVGに影をつける
        setHover(true);
    };


    /**
     * mouse leave ホバー終了処理
     * @param e
     */
    const handleMouseLeave = () => {
        //SVGの影をクリア
        setHover(false);
    };


    /**
     * 範囲選択との衝突判定
     */
    const selectorIntersect = () => {
        const { zoom, position, dragRange } = props;
        const operator = {
            x: position.x,
            y: position.y,
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

        return isSelected();
    };


    const isCommandNode = (node): boolean => {
        // return (step instanceof CommandStepModel);
        return node.type === 'command';
    };

    const isDataFrame = (node): boolean => {
        return node.type === 'frame';
    };

    const isSubFlow = (node): boolean => {
        return node.type === 'flow';
    };

    const isNote = (node): boolean => {
        // return (step instanceof NoteStepModel);
        return node.type === 'note';
    };

    const getFilter = () => {
        const filter = "url(#default-shadow)";
        return filter;
    };
    useEffect(() => {
        const { addSelectNode, deleteSelectNode } = props;
        // componentDidUpdate
        if (selectorIntersect()) {
            if (!isSelected()) {
                addSelectNode(node.id);
            }

        } else {
            if (isSelected()) {
                deleteSelectNode(node.id);
            }
        }
    });

    const { position, runnables, flowData, invalid, error } = props;
    const { x, y } = position;
    let icon: JSX.Element | null;

    /**
     * Nodeの種類に応じた見た目の設定
     */

    const filter = getFilter();

    const selected = selectorIntersect();

    const flowIn = flowData.ports[0].exists(node.id);
    const flowOut = flowData.ports[1].exists(node.id);

    let nodeLabel = node.label;

    if (isDataFrame(node)) {
        const frameNode = node as FrameNodeType;
        // データノード
        let innerIcon: JSX.Element;
        if (flowIn || flowOut) {
            // IN、OUT指定がある場合
            innerIcon = <InOutIcon flowIn={flowIn}
                                   flowOut={flowOut}
                                   width={50}
                                   height={50}
                                   stroke={"#CCCCCC"}
                                   fill={"#CCCCCC"} />;
        } else {
            // IN、OUT指定のない場合
            innerIcon = <FileIcon fillColor={(frameNode.hasData()) ? "#63CFFD" : "#CCCCCC"}
                                  width={16}
                                  height={20} />;
        }

        icon = <Rect selectedOutlineColor={"#93DFFF"} fillColor={"#FFFFFF"}
                     hoverFillColor={"#E8F8FF"} selectedFillColor={"#E8F8FF"}
                     hover={hover} selected={selected} stroke={"#63CFFD"}
                     filter={filter} style={RectStyle}>
            {innerIcon}
        </Rect>;
    } else if (isSubFlow(node)) {
        const flowNode = node as FlowNodeType | InlineFlowNodeType;
        if (flowNode.hasOwnProperty('flow') && flowNode.classification === "data_source") {
            icon = <DataSrcIcon hover={hover} selected={selected} filter={filter} style={{ ...RectStyle, rx: 12, ry: 12 }} />
        } else if (flowNode.hasOwnProperty('flow') && flowNode.classification === "data_dest") {
            icon = <DataDstIcon hover={hover} selected={selected} filter={filter} style={{ ...RectStyle, rx: 12, ry: 12 }} />
        } else {
            // サブフローノード
            icon = <SubFlowIcon hover={hover} selected={selected} filter={filter} />;
            nodeLabel = flowNode.label;
        }
    } else if (isCommandNode(node)) {
        const commandNode = node as CommandNodeType;
        // コマンドノード
        let command;
        if (runnables.commands) {
            runnables.commands.forEach(c => {
                if (c.id === commandNode.commandId) command = c;
            });
            icon = <CommandIcon command={command} hover={hover} selected={selected} filter={filter} />;
        } else {
            icon = null;
        }
        nodeLabel = commandNode.label;
    } else if (isNote(node)) {
        const noteNode = node as NoteNodeType;
        icon = <NoteIcon hover={hover} selected={selected} model={noteNode} />;
        nodeLabel = noteNode.label;
    } else {
        icon = null;
    }


    const invalid_icon = (invalid && Object.keys(invalid).length) ? <ErrorIcon /> : null;
    const error_icon = (error && Object.keys(error).length) ? <ErrorIcon /> : null;
    const label_text = (!!nodeLabel) ? 
                        <g className={style.labelContainer}>
                            <foreignObject {...NodeTextStyle} transform={"translate(" + (-1 * NodeTextStyle.width) + ",0)"}>
                                <div style={{
                                    display: "table",
                                    width: "100%",
                                    height: NodeTextStyle.height,
                                    paddingRight: NodeTextStyle.padding + "px"
                                }}>
                                    <p style={{
                                        display: "table-cell",
                                        verticalAlign: "middle",
                                        textAlign: "right",
                                        wordBreak: "break-all"
                                    }}>{nodeLabel}</p>
                                </div>
                            </foreignObject>
                        </g>
                        : null;

    return (
        <g className={style.operator} transform={"translate(" + x + "," + y + ")"}>
            <g className={style.iconContainer} onMouseDown={(e: React.MouseEvent<SVGElement>) => handleMouseDown(e)}
                onMouseOver={() => handleMouseOver()}
                onMouseLeave={() => handleMouseLeave()}>
                {icon}
            </g>
            {invalid_icon}
            {error_icon}
            {label_text}
        </g>
    );
};

export const RectStyle = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    width: Constants.default.datasource.width,
    height: Constants.default.datasource.height,
    rx: 0,
    ry: 0,
    strokeWidth: 2
};

export const CircleStyle = {
    cx: Constants.default.operator.cx,
    cy: Constants.default.operator.cy,
    tx: 0,
    ty: 0,
    fill: "#ffffff",
    stroke: "#FC9E28",
    r: Constants.default.operator.r,
    strokeWidth: 2
};

export const NodeTextStyle = {
    width: 80,
    height: 50,
    fontSize: 10,
    padding: 8
};
