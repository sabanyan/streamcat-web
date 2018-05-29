// @flow
import * as React from 'react'
import { render } from 'react-dom'
import Constants from "../../../../constants";


type Props = {
    fillColor: string,
    padding: number,
    children: React.Node,
    filter: string,
    stroke: string,
    style: {}
}


export default class Rect extends React.Component<Props>{
    static defaultProps = {
        padding: Constants.default.step.icon.padding
    }
    constructor(props:Props){
        super(props)
    }
    render(){
        return <g>
            <rect filter={this.props.filter}
                       className="body" {...this.props.style}
        fill={this.props.fillColor}
        stroke={this.props.stroke}>
        </rect>
            {this.props.children}
        </g>
    }
}