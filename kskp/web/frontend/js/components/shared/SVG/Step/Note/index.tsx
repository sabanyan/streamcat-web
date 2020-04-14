import * as React from 'react'
import { StringUtil } from 'Utils/index'
import Constants from "Constants/index";
import {CSSProperties} from "react";
import {NoteStepModel} from "Model/index";

type Props = {
  hover: boolean,
  selected: boolean,
  model: NoteStepModel,
  filter: string | null,
}

export default class Note extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  calculateSize () {
    let model = this.props.model;
    const fontSize = parseInt(model.getFontSize(),0);
    let width = StringUtil.getTextWidth(model.title, fontSize);
    const style = ContentStyle;
    style.width = Constants.default.note.width + Constants.default.note.padding;
    style.height = fontSize + Constants.default.note.padding;
    let textWidth = width + Constants.default.note.padding;

    if (style.width < textWidth) {
      style.width = textWidth
    }

    const size = {
      width: style.width,
      height: style.height
    };

    return size
  }

  getColor(){
    const {model} = this.props;
    const color = model.getColor();
    switch (color){
      case Constants.default.note.color.green:
        return{
          fillColor: "#f7ffef",
          borderColor: "#cbe3c5",
        };
      case Constants.default.note.color.yellow:
        return{
          fillColor: "#fffadb",
          borderColor: "#ffe772",
        };
      case Constants.default.note.color.red:
        return{
          fillColor: "#fff7f7",
          borderColor: "#ffd5d5",
        };
      default:
        return{
          fillColor: "#f7ffef",
          borderColor: "#cbe3c5",
        };
    }
  }

  renderShape (size) {
    const style = NoteStyle;
    const {selected} = this.props;
    style.width = size.width;
    style.height = size.height;
    style.fill = this.getColor().fillColor;
    style.stroke = this.getColor().borderColor;
    style.strokeWidth = 1;
    if (selected) {
      style.strokeWidth = Constants.default.step.borderWidth * 2;
    }
    return <rect {...style}/>;
  }

  renderContent (size) {
    const {model} = this.props;
    const style = ContentStyle;
    style.width = size.width;
    style.height = size.height;
    style.fontSize = model.getFontSize();
    return <foreignObject {...style} transform={'translate(0,0)'}>
      <div style={{display: 'table', width: '100%', height: style.height, paddingRight: style.padding + 'px'}}>
        <p style={TextStyle}>
          {this.props.model.title}
        </p>
      </div>
    </foreignObject>
  }

  render () {
    const size = this.calculateSize();
    const {width,height} = size;
    return <g>
        <text>{width
        }</text>
      <svg width={width}
           height={height}>
        {this.renderShape(size)}
        {this.renderContent(size)}
      </svg>
    </g>
  }
}

export const NoteStyle = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rx: 0,
  ry: 0,
  fill:"",
  strokeWidth: Constants.default.step.borderWidth * 2,
  stroke: "",
};

export const ContentStyle = {
  x: 0,
  y: 0,
  width:  50,
  height: 100,
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fontSize: 10,
  padding: 8,
  display: 'table-cell',
  verticalalign: 'middle',
  textalign: 'right'
};


export const TextStyle:CSSProperties = {
  width: 'fit-content',
  height: 'auto',
  display: 'table-cell',
  overflow: 'visible',
  verticalAlign: 'middle',
  textAlign: 'left',
  paddingLeft: 8,
  wordBreak: 'keep-all'
};
