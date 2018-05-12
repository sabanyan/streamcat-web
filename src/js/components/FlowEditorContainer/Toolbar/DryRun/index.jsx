import React from 'react'

const DryRun = (props) => {
  const {onClick} = props;
  return <button type="button" className="btn btn-default btn-sm dry-run" disabled={true}>
    <div className="icon">
      <i className="icon material-icons">&#xE044;</i>
    </div>
    <div className="text">
      ドライラン
    </div>
  </button>
}

export default DryRun
