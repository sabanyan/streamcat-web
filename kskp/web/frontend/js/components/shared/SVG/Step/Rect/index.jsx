//@flow
import * as React from 'react'
import Constants from 'Constants'

type Props = {
  selectedOutlineColor: string,
  fillColor: string,
  hoverFillColor: string,
  selectedFillColor: string,
  padding: number,
  children: React.Node,
  filter: string,
  stroke: string,
  style: { x: number, y: number, width: number, height: number, rx: number, ry: number },
  hover: boolean,
  selected: boolean
}

export default class Rect extends React.Component<Props> {
  static defaultProps = {
    padding: Constants.default.step.icon.padding,
  }

  constructor (props: Props) {
    super(props)
  }

  render () {

    let fillColor = this.props.fillColor

    if (this.props.hover) {
      fillColor = this.props.hoverFillColor
    }
    if (this.props.selected) {
      fillColor = this.props.selectedFillColor
    }

    const {selected} = this.props
    let outline
    let {filter} = this.props

    const outline_style = {
      ...this.props.style,
      x: this.props.style.x - Constants.default.step.borderWidth,
      y: this.props.style.y - Constants.default.step.borderWidth,
      width: this.props.style.width + Constants.default.step.borderWidth * 2,
      height: this.props.style.height + Constants.default.step.borderWidth * 2,
      rx: this.props.style.rx,
      ry: this.props.style.ry,
    }

    if (selected) {
      filter = null
      outline = <rect filter={filter}
                      stroke={this.props.selectedOutlineColor}
                      {...outline_style}
                      fill={'none'}
                      strokeWidth={Constants.default.step.borderWidth * 2}
      >
      </rect>
    }
    const {style} = this.props;

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
            stroke={this.props.stroke}>
      </rect>
      {this.props.children}
    </g>
  }
}