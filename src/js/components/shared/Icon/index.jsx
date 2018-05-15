// @flow
import * as React from 'react'

type Props = {
  fillColor: string;
  height: number;
  width: number;
  padding: number;
  children: React.Node;
}

class Icon extends React.Component<Props> {
  static defaultProps = {
    fillColor: "#63B8E2",
    height: 44,
    width: 44,
    padding: 16,
  }
  render (){
    return <g transform={"translate(" + this.props.padding + "," + this.props.padding + ")"}>
      <svg fill={this.props.fillColor} height={this.props.height}
           viewBox={"0 0 " + this.props.width / 2 + " " + this.props.height / 2} width={this.props.width}
           xmlns="http://www.w3.org/2000/svg">
        {this.props.children}
      </svg>
    </g>
  }
}

export default Icon