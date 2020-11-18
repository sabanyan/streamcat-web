import * as React from "react";
import {CSSProperties} from "react";
import {StringUtil} from "Utils/index";
import Constants from "Constants/index";
import {NoteStepModel} from "Model/index";

type Props = {
    hover: boolean,
    selected: boolean,
    model: NoteStepModel,
    filter?: string | null,
}

const Note = (props: Props) => {
    const getColor = () => {
        const {model} = props;
        const color = model.getColor();
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
        style.fontSize = model.getFontSize();
        return <foreignObject {...style} transform={"translate(0,0)"}>
            <div style={{display: "table", width: "100%", height: style.height, paddingRight: style.padding + "px"}}>
                <p style={NoteTextStyle}>
                    {model.title}
                </p>
            </div>
        </foreignObject>;
    };

    const {model} = props;
    const size = model.size
    const {width, height} = model.size;

    return <g>
        <svg width={width}
             height={height}>
            {renderShape(size)}
            {renderContent(size)}
        </svg>
    </g>;
};

export {Note};

export const NoteStyle = {
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

export const NoteContentStyle = {
    x: 0,
    y: 0,
    width: 50,
    height: 100,
    textAnchor: "middle",
    dominantBaseline: "central",
    fontSize: 10,
    padding: 8,
    display: "table-cell",
    verticalalign: "middle",
    textalign: "right"
};


export const NoteTextStyle: CSSProperties = {
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
