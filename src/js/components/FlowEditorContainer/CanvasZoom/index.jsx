import React from 'react'

export default class CanvasZoom extends React.Component {
  render () {
    return <div className="btn-group kskp-canvas-tool zoom">
      <button type="button" className="btn btn-default btn-sm zoom-out" disabled={true}>-</button>
      <button type="button" className="btn btn-default btn-sm zoom-default" disabled={true}>100%</button>
      <button type="button" className="btn btn-default btn-sm zoom-in" disabled={true}>+</button>
    </div>
  }
}