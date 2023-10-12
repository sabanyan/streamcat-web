import React, { useEffect, useState } from "react";
import Constants from "Constants/index";
import { CommandIcon, ErrorIcon, FileIcon, InOutIcon, NoteIcon, Rect, SubFlowIcon, DataSrcIcon, DataDstIcon } from "Shared/SVG";
import style from "./style.scss";
import { Api } from 'Api';
import { ZoomUtil } from "Utils/index";
import { DragType, GraphType, RunnablesType } from "Types/index";
import { AllNodeType, Flow, FrameType } from "Model/Library";
import { CommandNodeType, FlowNodeType, FrameNodeType, InlineFlowNodeType, NoteNodeType } from "Model/Step/NodeTypes";
import { graphUtil } from "Modules/flowEditor";

let mouseMoveEvent;
let mouseUpEvent;

interface Props {
    step: AllNodeType;
    position: { x: number, y: number };
    selected: boolean;
    invalid?: {};
    error?: {};
    runnables: RunnablesType;
    flowData: Flow;
    graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    selectedStepIds: string[];
    zoom: number;
    dragRange: DragType | null;
    addSelectStep: (selected_step_id: string) => void;
    deleteSelectStep: (selected_step_id: string) => void;
    selectSteps: (selected_steps: any[]) => void;
    selectFrame: (frame?:FrameType) => void;
    addHistory: () => void;
    readOnly: boolean;
}

// useStateを使うと期待通り動作しないので修正
let coords: { x: number, y: number } | null = null;
let setCoords = (_coords: { x: number, y: number } | null) => {
    coords = _coords;
};

const Step = (props: Props) => {
    const { step } = props;

    const [hover, setHover] = useState<boolean>(false);

    const isSelected = () => {
        const { selectedStepIds } = props;
        let selected = false;
        selectedStepIds.map((id) => {
            if (id === step.id) {
                selected = true;
            }
        });
        return selected;
    };

    /**
     * mouse down ステップ選択処理
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

        const { addSelectStep, deleteSelectStep, selectSteps, selectFrame, addHistory } = props;
        //選択イベントの呼び出し
        if (e.shiftKey) {
            if (!isSelected()) {
                addSelectStep(step.id);
            } else {
                deleteSelectStep(step.id);
            }
        } else {
            //一度選択状態をクリアする（#71）
            selectSteps([]);
            selectSteps([step]);

            //データフレームの詳細を取得する
            const selected_step: AllNodeType = step;//this.getSelectedStep()
            if (selected_step.type === 'frame') {
                const frameNode = selected_step as FrameNodeType;
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
     * mouse move ステップのドラッグ処理
     * @param e
     */
    const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
        const { selectedStepIds, readOnly } = props;
        if (readOnly) return; // 読み取り専用の場合は移動不可

        if (selectedStepIds.length > 1) {
            // 複数のStepを一括して移動させる
            onMoveSteps(e);
        } else {
            // 単一のStepを移動させる
            onMoveStep(e);
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

    const moveSteps = (flowData:Flow, x: number, y: number, selectedStepIds:string[]) => {
        const [graph, setGraph] = props.graphState;
        const { zoom } = props;

        // 移動距離を算出する
        const dx = (step.position.x - x);
        const dy = (step.position.y - y);

        // 選択中の全てのStepを移動する
        // 複数のStepを一括で移動させる場合は、そのStepの中に自Stepが含まれていること
        flowData.nodes.filter(node => selectedStepIds.includes(node.id)).forEach(node => {
            // Stepの位置を変更する
            node.position.x = node.position.x - dx;
            node.position.y = node.position.y - dy;
        });

        // Canvasへ反映させる
        setGraph(graphUtil.getGraph(flowData.nodes, zoom));
    };

    const onMoveStep = (e: React.MouseEvent<SVGElement>) => {
        const { new_x, new_y } = calcNewPosition(e);
        moveSteps(flowData, new_x, new_y, [step.id]);
    };

    const onMoveSteps = (e: React.MouseEvent<SVGElement>) => {
        const { selectedStepIds } = props;
        if (selectedStepIds.includes(step.id)) {
            const { new_x, new_y } = calcNewPosition(e);
            moveSteps(flowData, new_x, new_y, selectedStepIds);
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


    const isCommandStep = (step): boolean => {
        // return (step instanceof CommandStepModel);
        return step.type === 'command';
    };

    const isDataFrame = (step): boolean => {
        return step.type === 'frame';
    };

    const isSubFlow = (step): boolean => {
        return step.type === 'flow';
    };

    const isNote = (step): boolean => {
        // return (step instanceof NoteStepModel);
        return step.type === 'note';
    };

    const getFilter = () => {
        const filter = "url(#default-shadow)";
        return filter;
    };
    useEffect(() => {
        const { addSelectStep, deleteSelectStep } = props;
        // componentDidUpdate
        if (selectorIntersect()) {
            if (!isSelected()) {
                addSelectStep(step.id);
            }

        } else {
            if (isSelected()) {
                deleteSelectStep(step.id);
            }
        }
    });

    const { position, runnables, flowData, invalid, error } = props;
    const { x, y } = position;
    let icon: JSX.Element | null;

    /**
     * STEPの種類に応じた見た目の設定
     */

    const filter = getFilter();

    const selected = selectorIntersect();

    const flowIn = flowData.ports[0].exists(step.id);
    const flowOut = flowData.ports[1].exists(step.id);

    let stepLabel = step.label;

    if (isDataFrame(step)) {
        const frameNode = step as FrameNodeType;
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
    } else if (isSubFlow(step)) {
        const flowNode = step as FlowNodeType | InlineFlowNodeType;
        if (flowNode.hasOwnProperty('flow') && flowNode.classification === "data_source") {
            icon = <DataSrcIcon hover={hover} selected={selected} filter={filter} style={{ ...RectStyle, rx: 12, ry: 12 }} />
        } else if (flowNode.hasOwnProperty('flow') && flowNode.classification === "data_dest") {
            icon = <DataDstIcon hover={hover} selected={selected} filter={filter} style={{ ...RectStyle, rx: 12, ry: 12 }} />
        } else {
            // サブフローノード
            icon = <SubFlowIcon hover={hover} selected={selected} filter={filter} />;
            stepLabel = flowNode.label;
        }
    } else if (isCommandStep(step)) {
        const commandNode = step as CommandNodeType;
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
        stepLabel = commandNode.label;
    } else if (isNote(step)) {
        const noteNode = step as NoteNodeType;
        icon = <NoteIcon hover={hover} selected={selected} model={noteNode} />;
        stepLabel = noteNode.label;
    } else {
        icon = null;
    }


    const invalid_icon = (invalid && Object.keys(invalid).length) ? <ErrorIcon /> : null;
    const error_icon = (error && Object.keys(error).length) ? <ErrorIcon /> : null;
    const label_text = (!!stepLabel) ? 
                        <g className={style.labelContainer}>
                            <foreignObject {...StepTextStyle} transform={"translate(" + (-1 * StepTextStyle.width) + ",0)"}>
                                <div style={{
                                    display: "table",
                                    width: "100%",
                                    height: StepTextStyle.height,
                                    paddingRight: StepTextStyle.padding + "px"
                                }}>
                                    <p style={{
                                        display: "table-cell",
                                        verticalAlign: "middle",
                                        textAlign: "right",
                                        wordBreak: "break-all"
                                    }}>{stepLabel}</p>
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

export { Step };

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

export const StepTextStyle = {
    width: 80,
    height: 50,
    fontSize: 10,
    padding: 8
};
