// @flow
import React from 'react'

type Props = {||}

export default class PaperZoom extends React.Component<Props> {
  render () {
    return <div className="btn-group kskp-canvas-tool zoom">
      <button type="button" className="btn btn-default btn-sm zoom-out" disabled={true}>-</button>
      <button type="button" className="btn btn-default btn-sm zoom-default" disabled={true}>100%</button>
      <button type="button" className="btn btn-default btn-sm zoom-in" disabled={true}>+</button>
    </div>
  }
}