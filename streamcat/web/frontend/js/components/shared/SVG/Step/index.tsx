import React, { useEffect, useState } from "react";
import Constants from "Constants/index";
import { CommandIcon, ErrorIcon, FileIcon, InOutIcon, NoteIcon, Rect, SubFlowIcon, DataSrcIcon, DataDstIcon } from "Shared/SVG";
import { CommandStepModel, DataFrameStepModel, NoteStepModel, SubFlowStepModel } from "Model/index";
import style from "./style.scss";
import { Api } from 'Api';
import { ZoomUtil } from "Utils/index";
import { DragType, RunnablesType, StepModelType } from "Types/index";
import { FlowType, FrameType } from "Model/Library";

let mouseMoveEvent;
let mouseUpEvent;

interface Props {
    model: StepModelType;
    position: { x: number, y: number };
    type: string;
    selected: boolean;
    text: string;
    invalid: {};
    error: {};
    runnables: RunnablesType;
    flow: FlowType;
    selectedStepIds: string[];
    zoom: number;
    dragRange: DragType | null;
    addSelectStep: (selected_step_id: string) => void;
    deleteSelectStep: (selected_step_id: string) => void;
    selectSteps: (selected_steps: any[]) => void;
    selectFrame: (frame?:FrameType) => void;
    updateStep: Function;
    moveSteps: Function;
    readOnly: boolean;
}

// useStateを使うと期待通り動作しないので修正
let coords: { x: number, y: number } | null = null;
let setCoords = (_coords: { x: number, y: number } | null) => {
    coords = _coords;
};

const Step = (props: Props) => {

    const [hover, setHover] = useState<boolean>(false);

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
        mouseMoveEvent = (e: React.MouseEvent<SVGElement>) => handleMouseMove(e);
        mouseUpEvent = (e: React.MouseEvent<SVGElement>) => handleMouseUp(e);
        document.addEventListener("mousemove", mouseMoveEvent, { passive: true });
        document.addEventListener("mouseup", mouseUpEvent, { passive: true });
    };

    const isSelected = () => {
        const { selectedStepIds, model } = props;
        let selected = false;
        selectedStepIds.map((id) => {
            if (id === model.id) {
                selected = true;
            }
        });
        return selected;
    };

    /**
     * mouse up
     * @param e
     */
    const handleMouseUp = (e: React.MouseEvent<SVGElement>) => {

        setCoords(null);

        const { model, addSelectStep, deleteSelectStep, selectSteps, selectFrame } = props;
        let step = model;
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
            const selected_step: StepModelType = step;//this.getSelectedStep()
            if (selected_step.type === 'frame') {
                if (selected_step.hasData() && selected_step.uuid) {
                    //TODO 将来的にはページングなどの対応が必要
                    Api.findFrame(selected_step.uuid).then(frame => {
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
    };
    /**
     * mouse move ステップのドラッグ処理
     * @param e
     */
    const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
        const { selectedStepIds, readOnly } = props;
        if (readOnly) return; // 読み取り専用の場合は移動不可
        if (selectedStepIds.length > 1) {
            onMoveSteps(e);
        } else {
            onUpdateStep(e);
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


    const onMoveSteps = (e: React.MouseEvent<SVGElement>) => {
        const { model, selectedStepIds, moveSteps } = props;
        if (selectedStepIds.includes(model.id)) {
            const { new_x, new_y } = calcNewPosition(e);
            moveSteps(new_x, new_y, model, selectedStepIds);
        }
    };

    const onUpdateStep = (e: React.MouseEvent<SVGElement>) => {
        const { selectedStepIds, model, updateStep } = props;
        if (selectedStepIds.length > 1) {
            onMoveSteps(e);
            return;
        }
        const { new_x, new_y } = calcNewPosition(e);
        //移動に応じてStepの位置を更新
        let step = model;
        // step.setPosition({ x: new_x, y: new_y });
        // step.position = {x:new_x, y:new_y} では何故かノードが移動しない
        step.position.x = new_x;
        step.position.y = new_y;
        updateStep(step);
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


    const isCommandStep = (model): boolean => {
        return (model instanceof CommandStepModel);
    };

    const isDataFrame = (model): boolean => {
        return (model.type === 'frame');
    };

    const isSubFlow = (model): boolean => {
        return (model instanceof SubFlowStepModel);
    };

    const isNote = (model): boolean => {
        // return (model instanceof NoteStepModel);
        return model.type === 'note';
    };

    const getFilter = () => {
        const filter = "url(#default-shadow)";
        return filter;
    };
    useEffect(() => {
        const { model, addSelectStep, deleteSelectStep } = props;
        // componentDidUpdate
        if (selectorIntersect()) {
            if (!isSelected()) {
                addSelectStep(model.id);
            }

        } else {
            if (isSelected()) {
                deleteSelectStep(model.id);
            }
        }
    });

    const { position, runnables, flow, invalid, error, model } = props;
    const { x, y } = position;
    let icon: JSX.Element | null;

    let step: StepModelType = model;

    /**
     * STEPの種類に応じた見た目の設定
     */

    const filter = getFilter();

    const selected = selectorIntersect();

    const flowIn = flow.flow.ports[0].exists(step.id);
    const flowOut = flow.flow.ports[1].exists(step.id);

    let stepLabel = step.label;

    if (isDataFrame(step)) {
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
            innerIcon = <FileIcon fillColor={(step.hasData()) ? "#63CFFD" : "#CCCCCC"}
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
        // サブフローノード
        icon = <SubFlowIcon hover={hover} selected={selected} filter={filter} />;
        stepLabel = step.getLabel();
    } else if (isCommandStep(step)) {
        // コマンドノード
        let command;
        if (runnables.commands) {
            runnables.commands.forEach(c => {
                if (c.id === step.commandId) command = c;
            });
            icon = <CommandIcon command={command} hover={hover} selected={selected} filter={filter} />;
        } else {
            icon = null;
        }
        stepLabel = step.getLabel();
    } else if (isNote(step)) {
        icon = <NoteIcon hover={hover} selected={selected} model={step} />;
        stepLabel = step.label;
    } else if (step.flow && step.classification === "data_source") {
        icon = <DataSrcIcon hover={hover} selected={selected} filter={filter} style={{ ...RectStyle, rx: 12, ry: 12 }} />
    } else if (step.flow && step.classification === "data_dest") {
        icon = <DataDstIcon hover={hover} selected={selected} filter={filter} style={{ ...RectStyle, rx: 12, ry: 12 }} />
    } else {
        icon = null;
    }


    const invalid_icon = (Object.keys(invalid).length) ? <ErrorIcon /> : null;
    const error_icon = (Object.keys(error).length) ? <ErrorIcon /> : null;
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
