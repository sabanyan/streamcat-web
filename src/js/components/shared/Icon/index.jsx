//@flow
import * as React from 'react'
import Constants from "../../../constants";
import style from './style.scss'

export type IconProps = {
    fillColor: string;
    height: number;
    width: number;
    padding: number;
    children: React.Node;
}

class Icon extends React.Component<IconProps> {
    static defaultProps = {
        fillColor: "#63B8E2",
        width: Constants.default.step.icon.width,
        height: Constants.default.step.icon.height,
        padding: Constants.default.step.icon.padding,
    }

    render() {
        return <g transform={"translate(" + this.props.padding + "," + this.props.padding + ")"}>
            <svg className={style.icon} fill={this.props.fillColor} preserveAspectRatio="xMidYMin" height={32} width={32}
                 viewBox={"0 0 "+this.props.width + " " + this.props.height}
                 xmlns="http://www.w3.org/2000/svg">
                {this.props.children}
            </svg>
        </g>
    }
}

export default Icon