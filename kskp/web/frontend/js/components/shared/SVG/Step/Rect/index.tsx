import * as React from "react";
import Constants from "Constants/index";

type Props = {
    selectedOutlineColor: string,
    fillColor: string,
    hoverFillColor: string,
    selectedFillColor: string,
    children: React.ReactNode,
    filter?: string,
    stroke: string,
    style: { x: number, y: number, width: number, height: number, rx: number, ry: number },
    hover?: boolean,
    selected?: boolean
}

const Rect = (props: Props) => {

    let {fillColor, hover, selected, filter, style, stroke, children, selectedOutlineColor, hoverFillColor, selectedFillColor} = props;

    if (hover) {
        fillColor = hoverFillColor;
    }
    if (selected) {
        fillColor = selectedFillColor;
    }

    let outline;

    const outline_style = {
        ...style,
        x: style.x - Constants.default.step.borderWidth,
        y: style.y - Constants.default.step.borderWidth,
        width: style.width + Constants.default.step.borderWidth * 2,
        height: style.height + Constants.default.step.borderWidth * 2,
        rx: style.rx,
        ry: style.ry
    };

    if (selected) {
        outline = <rect filter={undefined}
                        stroke={selectedOutlineColor}
                        {...outline_style}
                        fill={"none"}
                        strokeWidth={Constants.default.step.borderWidth * 2}
        >
        </rect>;
    }

    return <g>
        {outline}
        <rect filter={filter}
              className="body"
              x={style.x}
              y={style.y}
              width={style.width}
              height={style.height}
              rx={style.rx}
              ry={style.ry}
              fill={fillColor}
              stroke={stroke}>
        </rect>
        {children}
    </g>;
};

export  {Rect}
