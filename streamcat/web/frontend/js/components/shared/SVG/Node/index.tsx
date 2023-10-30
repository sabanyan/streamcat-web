import React, { useEffect, useState } from "react";
import Constants from "Constants/index";
import { CommandIcon, ErrorIcon, FileIcon, InOutIcon, NoteIcon, Rect, SubFlowIcon, DataSrcIcon, DataDstIcon } from "Shared/SVG";
import style from "./style.scss";
import { ZoomUtil } from "Utils/index";
import { DragType, GraphType, RunnablesType } from "Types/index";
import { AllNodeType, Flow, FlowType } from "Model/Library";
import { CommandNodeType, FlowNodeType, FrameNodeType, InlineFlowNodeType, NoteNodeType } from "Model/Node/NodeTypes";
import { graphUtil } from "Modules/flowEditor";

interface Props {
    node: AllNodeType;
    // position: { x: number, y: number };
    selected: boolean;
    // invalid?: {};
    // error?: {};
    runnables: RunnablesType;
    // flowData: Flow;
    flowIn: boolean;
    flowOut: boolean;
    // flowState: [FlowType, (value:React.SetStateAction<FlowType>)=>void];
    // graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    // selectedNodes: AllNodeType[];
    // zoom: number;
    // dragRange: DragType | null;
    // addSelectNode: (selectedNode: AllNodeType) => void;
    // unselectNode: (selectedNodeId: string) => void;
    // selectNodes: (selectedNodes: AllNodeType[]) => void;
    // selectFrame: (frame?:FrameType) => void;
    // addHistory: () => void;
    // readOnly: boolean;
    onMouseDown: (node:AllNodeType, e: React.MouseEvent<SVGElement>) => void;
}

export const Node = (props: Props) => {
    const { node, selected } = props;

    const [hover, setHover] = useState<boolean>(false);


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
    // useEffect(() => {
    //     const { selected, addSelectNode, unselectNode } = props;
    //     // componentDidUpdate
    //     if (selected) {
    //         if (!selected) {
    //             addSelectNode(node);
    //         }

    //     } else {
    //         if (selected) {
    //             unselectNode(node.id);
    //         }
    //     }
    // });

    const { flowIn, flowOut, runnables, onMouseDown } = props;
    const { x, y } = node.position;
    let icon: JSX.Element | null;

    /**
     * Nodeの種類に応じた見た目の設定
     */

    const filter = getFilter();

    // const selected = selectorIntersect();

    // const flowIn = flowData.ports[0].exists(node.id);
    // const flowOut = flowData.ports[1].exists(node.id);

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


    const invalid_icon = (node.invalid && Object.keys(node.invalid).length) ? <ErrorIcon /> : null;
    const error_icon = (node.error && Object.keys(node.error).length) ? <ErrorIcon /> : null;
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
            <g className={style.iconContainer}
                onMouseDown={e => onMouseDown(node, e)}
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
