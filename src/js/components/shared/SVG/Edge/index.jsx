//@flow
import React from 'react'
import style from './style.scss'
import { Arrow } from 'Shared/SVG'
import Constants from 'Constants/index'
import { StringUtil } from "Utils/index";
import { TextStyle } from "Shared/SVG/Step/Note";

type EdgeProps = {
  srcLabel: string;
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

/**
 * 二点間の角度の計算
 * ref:https://www.s-projects.net/point-to-angle.html
 * @param edge
 * @returns {number}
 */
const getArrowAngle = (edge: EdgeProps) => {
  return Math.round(Math.atan2(edge.wy - edge.vy, edge.wx - edge.vx) / Math.PI * 180) - 90
}

const getRectOfEdgeAngle = (edge: EdgeProps) => {
  return Math.round(Math.atan2(edge.wy - edge.vy, edge.wx - edge.vx) / Math.PI * 180) * -1 + 180
}

const edgeOfRect = (rect: RectProps, deg) => {
  const twoPI = Math.PI * 2
  let theta = deg * Math.PI / 180

  while (theta < -Math.PI) {
    theta += twoPI
  }

  while (theta > Math.PI) {
    theta -= twoPI
  }

  let rectAtan = Math.atan2(rect.height, rect.width)
  let tanTheta = Math.tan(theta)
  let region

  if ((theta > -rectAtan) && (theta <= rectAtan)) {
    region = 1
  } else if ((theta > rectAtan) && (theta <= (Math.PI - rectAtan))) {
    region = 2
  } else if ((theta > (Math.PI - rectAtan)) || (theta <= -(Math.PI - rectAtan))) {
    region = 3
  } else {
    region = 4
  }

  let edgePoint = {x: rect.x, y: rect.y}
  let xFactor = 1
  let yFactor = 1

  switch (region) {
    case 1:
      yFactor = -1
      break
    case 2:
      yFactor = -1
      break
    case 3:
      xFactor = -1
      break
    case 4:
      xFactor = -1
      break
  }

  if ((region === 1) || (region === 3)) {
    edgePoint.x += xFactor * (rect.width / 2.)                                     // "Z0"
    edgePoint.y += yFactor * (rect.width / 2.) * tanTheta
  } else {
    edgePoint.x += xFactor * (rect.height / (2. * tanTheta))                        // "Z1"
    edgePoint.y += yFactor * (rect.height / 2.)
  }

  return edgePoint
}

const Edge = (props: EdgeProps) => {
  const {srcLabel, vx, vy, wx, wy} = props

  let port = null
  // 矢印を回転させるための角度計算(transformで使用）
  const arrowAngle = getArrowAngle(props)
  // 線をRectの縁に沿うようにレンダリングするための角度計算
  const rectOfEdgeAngle = getRectOfEdgeAngle(props)

  const dstRect = {
    x: wx,
    y: wy,
    width: Constants.default.step.width + Constants.default.step.borderWidth * 2,
    height: Constants.default.step.height + Constants.default.step.borderWidth * 2
  }
  let width = StringUtil.getTextWidth(srcLabel, TextStyle.fontSize)
  const srcMarginOffsetWidth = width;
  const srcMarginOffsetHeight = 10;
  const srcRect = {
    x: vx,
    y: vy,
    width: Constants.default.step.width + Constants.default.step.borderWidth * 2 + srcMarginOffsetWidth,
    height: Constants.default.step.height + Constants.default.step.borderWidth * 2+ srcMarginOffsetHeight
  }

  const arrowPosition = edgeOfRect(dstRect, rectOfEdgeAngle)
  const srcPosition = edgeOfRect(srcRect, rectOfEdgeAngle + 180)

  const text_x = srcPosition.x
  const text_y = srcPosition.y
  port = <g transform={'translate(' + 0 + ',' + 5 + ')'}>
    <text className={style.portLabel} transform={'translate(' + text_x + ',' + text_y + ')'} fontSize={12} textAnchor={'middle'}
          width={100}>{srcLabel}</text>
  </g>

  return <g>
    <path className={style.edge}
          d={'M' + vx + ',' + vy + ' ' + 'L' + arrowPosition.x + ',' + arrowPosition.y} />
    <path className={style.base}
          d={'M' + vx + ',' + vy + ' ' + 'L' + arrowPosition.x + ',' + arrowPosition.y} />
    <Arrow x={arrowPosition.x} y={arrowPosition.y} width={6} height={6} angle={arrowAngle} className={style.edge} />
    <Arrow x={arrowPosition.x} y={arrowPosition.y} width={6} height={6} angle={arrowAngle} className={style.base} />
    {port}
  </g>
}

export default Edge
