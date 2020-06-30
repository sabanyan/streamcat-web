import React, {useEffect, useState} from "react";
import Constants from "Constants/index";
import {CommandIcon, ErrorIcon, FileIcon, InOutIcon, Note, Rect, SubFlowIcon} from "Shared/SVG";
import {CommandStepModel, DataFrameStepModel, NoteStepModel, SubFlowStepModel} from "Model/index";
import style from "./style.scss";
import {APIUtil, ZoomUtil} from "Utils/index";
import {DragType, MastType, StepModelType} from "Types/index";
import {FlowModelProps} from "Model/Flow/FlowModel";

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
    mast: MastType;
    flow: FlowModelProps;
    selected_step_ids: string[];
    zoom: number;
    drag: DragType;
    addSelectStep: Function;
    deleteSelectStep: Function;
    selectSteps: Function;
    updateDataFrameDetail: Function;
    updateStep: Function;
    moveSteps: Function;
    movable: boolean
}

const Step = (props: Props) => {

    const [coords, setCoords] = useState<null | { x: number, y: number }>(null);
    const [hover, setHover] = useState<boolean>(false);
    /**
     * mouse down ステップ選択処理
     * @param e
     */
    const handleMouseDown = (e: React.MouseEvent<SVGElement>) => {
        //mousemoveイベントでハンドリング
        // fix #195
        console.log("handleMouseDown");

        if (e.button === 0) onMouseLeftDown(e);
    };

    const onMouseLeftDown = (e: React.MouseEvent<SVGElement>) => {

        setCoords({
            x: e.pageX,
            y: e.pageY
        });

        console.log("onMouseLeftDown");
        console.log({
            x: e.pageX,
            y: e.pageY
        });
        console.log("setCoords",coords);

        mouseMoveEvent = (e: React.MouseEvent<SVGElement>) => handleMouseMove(e);
        mouseUpEvent = (e: React.MouseEvent<SVGElement>) => handleMouseUp(e);
        document.addEventListener("mousemove", mouseMoveEvent, {passive: true});
        document.addEventListener("mouseup", mouseUpEvent, {passive: true});
    };

    const isSelected = () => {
        const {selected_step_ids, model} = props;
        let selected = false;
        selected_step_ids.map((id) => {
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

        console.log("handleMouseUp");
        setCoords(null);
        console.log("setCoords",coords);

        const {model, addSelectStep, deleteSelectStep, selectSteps, updateDataFrameDetail} = props;
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
            selectSteps();
            selectSteps([step]);

            //データフレームの詳細を取得する
            const selected_step: StepModelType = step;//this.getSelectedStep()
            if (selected_step instanceof DataFrameStepModel) {
                if (selected_step.hasData()) {
                    //TODO 将来的にはページングなどの対応が必要
                    APIUtil.get("frames/" + selected_step.uuid + "?no_contents=1").then((response) => {
                        const json = response.data;
                        updateDataFrameDetail(json.data);
                    });
                } else {
                    updateDataFrameDetail({});
                }
            } else {
                updateDataFrameDetail({});
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
        console.log("mouse move")
        const {selected_step_ids} = props;
        if (selected_step_ids.length > 1) {
            onMoveSteps(e);
        } else {
            onUpdateStep(e);
        }
        //一時保存された位置を更新
        setCoords({
            x: e.pageX,
            y: e.pageY
        });
        console.log("setCoords",coords);
    };

    const onMoveSteps = (e : React.MouseEvent<SVGElement>) => {
        const {zoom, model, selected_step_ids, moveSteps} = props;
        if (selected_step_ids.includes(model.id)) {
            let x = ZoomUtil.zoomReverse(e.pageX, zoom);
            let y = ZoomUtil.zoomReverse(e.pageY, zoom);
            moveSteps(x, y, model);
        }
    };

    const onUpdateStep = (e: React.MouseEvent<SVGElement>) => {
        const {zoom, selected_step_ids, position, model, updateStep} = props;
        if (selected_step_ids.length > 1) {
            onMoveSteps(e);
            return;
        }
        let coords_x = e.pageX;
        let coords_y = e.pageY;

        console.log(coords);
        if (coords) {
            console.log("has coords");
            coords_x = coords.x;
            coords_y = coords.y;
        }

        //移動量から現在位置を割り出す
        const xDiff = coords_x - e.pageX;
        const yDiff = coords_y - e.pageY;
        const new_x = position.x - ZoomUtil.zoomReverse(xDiff, zoom);
        const new_y = position.y - ZoomUtil.zoomReverse(yDiff, zoom);

        console.log(xDiff);
        console.log(yDiff);
        //移動に応じてStepの位置を更新
        let step = model;
        step.setPosition({x: new_x, y: new_y});
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
        const {zoom, position, drag} = props;
        const operator = {
            x: position.x,
            y: position.y,
            width: Constants.default.step.width,
            height: Constants.default.step.height
        };

        const {start, end} = drag;
        if (start && end) {
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


    const isStep = (model): boolean => {
        return (model instanceof CommandStepModel);
    };

    const isDataFrame = (model): boolean => {
        return (model instanceof DataFrameStepModel);
    };

    const isSubFlow = (model): boolean => {
        return (model instanceof SubFlowStepModel);
    };

    const isNote = (model): boolean => {
        return (model instanceof NoteStepModel);
    };

    const getFilter = () => {
        const filter = "url(#default-shadow)";
        return filter;
    };
    useEffect(() => {
        const {model, addSelectStep, deleteSelectStep} = props;
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

    const {position, mast, flow, invalid, error, model} = props;
    const {x, y} = position;
    let icon;

    let step: StepModelType = model;

    /**
     * STEPの種類に応じた見た目の設定
     */

    const filter = getFilter();

    const selected = selectorIntersect();

    const flowIn = flow.hasInPortWithId(step.id);
    const flowOut = flow.hasOutPortWithId(step.id);

    let stepLabel = step.getLabel();

    if (flowIn || flowOut) {
        icon = <g>
            <Rect padding={5} selectedOutlineColor={"#93DFFF"} fillColor={"#FFFFFF"}
                  hoverFillColor={"#E8F8FF"} selectedFillColor={"#E8F8FF"}
                  hover={hover} selected={selected} stroke={"#63CFFD"}
                  filter={filter} style={RectStyle}>
                <InOutIcon flowIn={flowIn} flowOut={flowOut} width={50} height={50} stroke={"#ccc"} fill={"#ccc"} />
            </Rect>
        </g>;
    } else if (isSubFlow(step)) {
        icon = <SubFlowIcon hover={hover} selected={selected} filter={filter} />;
        stepLabel = step.getLabel();
    } else if (isStep(step)) {
        //ステップ
        let command;
        if (mast.commands) {
            mast.commands.forEach(c => {
                if (c.id === step.commandId) command = c;
            });
            icon = <CommandIcon command={command} hover={hover} selected={selected} filter={filter} />;
        }
        stepLabel = step.getLabel();
    } else if (isDataFrame(step)) {
        //データソース
        const stroke = (!step.hasData()) ? {stroke: "#CCCCCC"} : {};
        icon =
            <Rect padding={5} selectedOutlineColor={"#93DFFF"} fillColor={"#FFFFFF"}
                  hoverFillColor={"#E8F8FF"} selectedFillColor={"#E8F8FF"}
                  hover={hover} selected={selected} stroke={"#63CFFD"}
                  filter={filter} style={RectStyle}>
                <FileIcon fillColor={(step.hasData()) ? "#63CFFD" : "#CCCCCC"}
                          width={16} height={20} />
            </Rect>;
    } else if (isNote(step)) {
        icon = <Note hover={hover} selected={selected} model={step} />;

    }

    let invalid_icon = (Object.keys(invalid).length)? <ErrorIcon/>: null;
    let error_icon = (Object.keys(error).length)? <ErrorIcon/>: null;

    return (
        <g className={style.operator} transform={"translate(" + x + "," + y + ")"}>
            <g className={style.iconContainer} onMouseDown={(e: React.MouseEvent<SVGElement>) => handleMouseDown(e)}
               onMouseOver={() => handleMouseOver()}
               onMouseLeave={() => handleMouseLeave()}>
                {icon}
            </g>
            {invalid_icon}
            {error_icon}
            <g className={style.labelContainer}>
                <foreignObject {...TextStyle} transform={"translate(" + (-1 * TextStyle.width) + ",0)"}>
                    <div style={{
                        display: "table",
                        width: "100%",
                        height: TextStyle.height,
                        paddingRight: TextStyle.padding + "px"
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
        </g>
    );
};

export {Step};

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

export const TextStyle = {
    width: 80,
    height: 50,
    fontSize: 10,
    padding: 8
};
