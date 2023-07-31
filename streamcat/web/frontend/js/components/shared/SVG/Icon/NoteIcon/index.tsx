import React from 'react';
import {CSSProperties} from "react";
import Constants from "Constants/index";
import {NoteStepModel} from "Model/index";
import { NoteNodeType } from 'Model/Step/NodeTypes';

type Props = {
    hover: boolean,
    selected: boolean,
    model: NoteNodeType,
    filter?: string | null,
}

const NoteIcon = (props: Props) => {

    const NoteStyle = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rx: 0,
        ry: 0,
        fill: "",
        strokeWidth: Constants.default.step.borderWidth * 2,
        stroke: ""
    };

    const NoteContentStyle = {
        x: 0,
        y: 0,
        width: 50,
        height: 100,
        textAnchor: "middle",
        dominantBaseline: "central",
        fontSize: 10,
        padding: 8,
        // FIXITL: 以下のプロパティを有効にすると、
        //         メモを新規配置したときにデータノードのIn/OUT表示が消える
        // display: "table-cell",
        verticalalign: "middle",
        textalign: "right"
    };

    const NoteTextStyle: CSSProperties = {
        width: "fit-content",
        height: "auto",
        display: "table-cell",
        overflow: "visible",
        verticalAlign: "middle",
        textAlign: "left",
        paddingLeft: 8,
        wordBreak: "keep-all",
        whiteSpace: "nowrap"
    };

    const getColor = () => {
        const {model} = props;
        const color = model.color;
        switch (color) {
            case Constants.default.note.color.green:
                return {
                    fillColor: "#f7ffef",
                    borderColor: "#cbe3c5"
                };
            case Constants.default.note.color.yellow:
                return {
                    fillColor: "#fffadb",
                    borderColor: "#ffe772"
                };
            case Constants.default.note.color.red:
                return {
                    fillColor: "#fff7f7",
                    borderColor: "#ffd5d5"
                };
            default:
                return {
                    fillColor: "#f7ffef",
                    borderColor: "#cbe3c5"
                };
        }
    };

    const renderShape = (size) => {
        const style = NoteStyle;
        const {selected} = props;
        style.width = size.width;
        style.height = size.height;
        style.fill = getColor().fillColor;
        style.stroke = getColor().borderColor;
        style.strokeWidth = 1;
        if (selected) {
            style.strokeWidth = Constants.default.step.borderWidth * 2;
        }
        return <rect {...style} />;
    };

    const renderContent = (size) => {
        const {model} = props;
        const style = NoteContentStyle;
        style.width = size.width;
        style.height = size.height;
        style.fontSize = model.fontSize || 16;
        return <foreignObject {...style} transform={"translate(0,0)"}>
            <div style={{display: "table", width: "100%", height: style.height, paddingRight: style.padding + "px"}}>
                <p style={NoteTextStyle}>
                    {model.title}
                </p>
            </div>
        </foreignObject>;
    };

    const {model} = props;
    const size = model.size;

    return <g>
        <svg width={model.size?.width}
             height={model.size?.height}>
            {renderShape(size)}
            {renderContent(size)}
        </svg>
    </g>;
};

export {NoteIcon};
