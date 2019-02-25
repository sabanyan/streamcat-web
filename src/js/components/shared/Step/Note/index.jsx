import * as React from 'react'
import { render } from 'react-dom'
import Constants from '../../../../constants'
import Step from '..';
import { StepModelType } from '../../../../types/index'
import Rect from '../Rect'
import StringUtil from '../../../../utils/StringUtil';

type Props = {
    hover: boolean,
    selected: boolean,
    model:StepModelType,
}

export default class Note extends React.Component<Props> {

    constructor (props: Props) {
        super(props)
    }

    calculate(text:string) {
       
        return 0;
    }

    calculateSzie() {

        let model = this.props.model
        let width = StringUtil.getTextWidth(model.content, TextStyle.fontSize)
        
        const style = ContentStyle

        style.width = Constants.default.note.width + Constants.default.note.padding
        style.height = Constants.default.note.height

        let textWidth = width + Constants.default.note.padding
        
        if (style.width < textWidth) {
            style.width = textWidth
        }

        const size = {
            width: style.width,
            height: style.height 
        }

        this.props.model.size = size
    }

    renderOutline() {
        const style = OutlineStyle
        style.selected = this.props.selected
        style.width = (this.props.model.getSize().width - Constants.default.step.borderWidth * 2) 
        style.height = (this.props.model.getSize().height - Constants.default.step.borderWidth * 2)
        
        return <rect {...style}></rect>
    }

    renderShape() {
        const style = NoteStyle
        style.selected = this.props.selected
        style.width = this.props.model.getSize().width
        style.height = this.props.model.getSize().height
        
        return <rect {...style}></rect>
    }

    renderContent() {
        const style = ContentStyle
        style.width = this.props.model.getSize().width
        style.height = this.props.model.getSize().height
        
        return <foreignObject {...style} transform={'translate(0,0)'}>
        <div style={{display:"table",width:"100%",height:style.height,paddingRight: style.padding + "px"}}>
        <p xmlns="http://www.w3.org/1999/xhtml" style={TextStyle}>
        {this.props.model.title}</p>
        </div>
      </foreignObject>
    }

    render () {
       
        this.calculateSzie()

        return <g>
            <svg width={this.props.model.size.width}
                        height={this.props.model.size.height}>
                    {this.renderOutline()}
                    {this.renderShape()}           
            </svg>
            {this.renderContent()}
        </g>
    }
}

export const OutlineStyle = {
    x: - Constants.default.step.borderWidth,
    y:  - Constants.default.step.borderWidth,
    width: 0,
    height: 0,
    rx: 0,
    ry: 0,
    fill: 'none',
    filter : 'none',
    strokeWidth: Constants.default.step.borderWidth * 2,
    stroke: '#d8ffb5'
}

export const NoteStyle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rx: 0,
    ry: 0,
    filter: 'url(#default-shadow)',
    strokeWidth: '2',
    fill: '#d8ffb5',
    stroke: '#d8ffb5'
}

export const ContentStyle = {
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    textAnchor: 'middle',
    dominantBaseline: 'central',
    fontSize: 10,
    padding: 8,
    display: 'table-cell',
    verticalalign:'middle',
    textalign:'right'
}

export const TextStyle = {
    width: 'fit-content',
    height: 'auto',
    display: 'table-cell',
    overflow: 'visible',
    verticalAlign: 'middle',
    textAlign: 'left',
    fontSize: 10,
    padding: 8,
    wordBreak: 'keep-all'
  }