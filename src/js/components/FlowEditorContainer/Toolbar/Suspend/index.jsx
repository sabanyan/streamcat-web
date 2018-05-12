import React from 'react'

const Suspend = (props) => {
  const {onClick} = props;
  return <button type="button" className="btn btn-default btn-sm abort" disabled={true}>
    <div className="icon">
      <i className="icon material-icons">&#xE034;</i>
    </div>
    <div className="text">
      実行を中止
    </div>
  </button>
}

export default Suspend
