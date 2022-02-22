import React from "react";
import style from "./style.scss";
import {Arrow, Port, StepTextStyle} from "Shared/SVG";
import Constants from "Constants/index";
import {StringUtil} from "Utils/index";

type EdgeProps = {
    outPortLabel: string;
    inPortLabel: string;
    vx: number;
    vy: number;
    wx: number;
    wy: number;
}

type RectProps = {
    x: number;
    y: number;
    width: number;
    height: number;
}

const Edge = (props: EdgeProps) => {
    /**
     * 二点間の角度の計算
     * ref:https://www.s-projects.net/point-to-angle.html
     * @param edge
     * @returns {number}
     */
    const getArrowAngle = (edge: EdgeProps) => {
        return Math.round(Math.atan2(edge.wy - edge.vy, edge.wx - edge.vx) / Math.PI * 180) - 90;
    };

    const getRectOfEdgeAngle = (edge: EdgeProps) => {
        return Math.round(Math.atan2(edge.wy - edge.vy, edge.wx - edge.vx) / Math.PI * 180) * -1 + 180;
    };

    const edgeOfRect = (rect: RectProps, deg) => {
        const twoPI = Math.PI * 2;
        let theta = deg * Math.PI / 180;

        while (theta < -Math.PI) {
            theta += twoPI;
        }

        while (theta > Math.PI) {
            theta -= twoPI;
        }

        let rectAtan = Math.atan2(rect.height, rect.width);
        let tanTheta = Math.tan(theta);
        let region;

        if ((theta > -rectAtan) && (theta <= rectAtan)) {
            region = 1;
        } else if ((theta > rectAtan) && (theta <= (Math.PI - rectAtan))) {
            region = 2;
        } else if ((theta > (Math.PI - rectAtan)) || (theta <= -(Math.PI - rectAtan))) {
            region = 3;
        } else {
            region = 4;
        }

        let edgePoint = {x: rect.x, y: rect.y};
        let xFactor = 1;
        let yFactor = 1;

        switch (region) {
            case 1:
                yFactor = -1;
                break;
            case 2:
                yFactor = -1;
                break;
            case 3:
                xFactor = -1;
                break;
            case 4:
                xFactor = -1;
                break;
        }

        if ((region === 1) || (region === 3)) {
            edgePoint.x += xFactor * (rect.width / 2.);                                     // "Z0"
            edgePoint.y += yFactor * (rect.width / 2.) * tanTheta;
        } else {
            edgePoint.x += xFactor * (rect.height / (2. * tanTheta));                        // "Z1"
            edgePoint.y += yFactor * (rect.height / 2.);
        }

        return edgePoint;
    };
    const {outPortLabel, inPortLabel, vx, vy, wx, wy} = props;

    // 矢印を回転させるための角度計算(transformで使用）
    const arrowAngle = getArrowAngle(props);
    // 線をRectの縁に沿うようにレンダリングするための角度計算
    const rectOfEdgeAngle = getRectOfEdgeAngle(props);

    // 矢印の位置計算
    const arrowRect = {
        x: wx,
        y: wy,
        width: Constants.default.step.width + Constants.default.step.borderWidth * 2,
        height: Constants.default.step.height + Constants.default.step.borderWidth * 2
    };
    const arrowPosition = edgeOfRect(arrowRect, rectOfEdgeAngle);

    // ポートのラベルの位置計算（ラベルの長さに応じた調整付き）
    let offsetWidth = StringUtil.getTextWidth(outPortLabel, StepTextStyle.fontSize);
    let offsetHeight = 10;
    const outPortRect = {
        x: vx,
        y: vy,
        width: Constants.default.step.width + Constants.default.step.borderWidth * 2 + offsetWidth,
        height: Constants.default.step.height + Constants.default.step.borderWidth * 2 + offsetHeight
    };
    offsetWidth = StringUtil.getTextWidth(inPortLabel, StepTextStyle.fontSize);
    const inPortRect = {
        x: wx,
        y: wy,
        width: Constants.default.step.width + Constants.default.step.borderWidth * 2 + offsetWidth,
        height: Constants.default.step.height + Constants.default.step.borderWidth * 2 + offsetHeight
    };
    const inPortPosition = edgeOfRect(inPortRect, rectOfEdgeAngle);
    const outPortPosition = edgeOfRect(outPortRect, rectOfEdgeAngle + 180);

    // ポートアイコンの位置計算
    offsetWidth = 6;
    offsetHeight = 6;
    const outPortIconRect = {
        x: vx,
        y: vy - 4.5,
        width: Constants.default.step.width + Constants.default.step.borderWidth * 2 - offsetWidth,
        height: Constants.default.step.height + Constants.default.step.borderWidth * 2 - offsetHeight
    };
    const inPortIconRect = {
        x: wx,
        y: wy - 4.5,
        width: Constants.default.step.width + Constants.default.step.borderWidth * 2 - offsetWidth,
        height: Constants.default.step.height + Constants.default.step.borderWidth * 2 - offsetHeight
    };
    const inPortIconPosition = edgeOfRect(inPortIconRect, rectOfEdgeAngle);
    const outPortIconPosition = edgeOfRect(outPortIconRect, rectOfEdgeAngle + 180);

    let outPort;
    let inPort;
    if (outPortLabel) {
        outPort = <g transform={"translate(" + 0 + "," + 5 + ")"}>
            <Port x={outPortIconPosition.x} y={outPortIconPosition.y} />
            <text fill={"#777"} className={style.portLabel}
                  transform={"translate(" + outPortPosition.x + "," + outPortPosition.y + ")"} fontSize={12}
                  textAnchor={"middle"}
                  width={100}>{outPortLabel}</text>
        </g>;
    }
    if (inPortLabel) {
        inPort = <g transform={"translate(" + 0 + "," + 5 + ")"}>
            <Port x={inPortIconPosition.x} y={inPortIconPosition.y} />
            <text fill={"#777"} className={style.portLabel}
                  transform={"translate(" + inPortPosition.x + "," + inPortPosition.y + ")"} fontSize={12}
                  textAnchor={"middle"}
            >{inPortLabel}</text>
        </g>;
    }

    return <g>
        <path className={style.edge}
              d={"M" + vx + "," + vy + " " + "L" + arrowPosition.x + "," + arrowPosition.y} />
        <path className={style.base}
              d={"M" + vx + "," + vy + " " + "L" + arrowPosition.x + "," + arrowPosition.y} />
        <Arrow x={arrowPosition.x} y={arrowPosition.y} width={6} height={6} angle={arrowAngle} className={style.edge} />
        <Arrow x={arrowPosition.x} y={arrowPosition.y} width={6} height={6} angle={arrowAngle} className={style.base} />
        {outPort}
        {inPort}
    </g>;
};

export {Edge};
