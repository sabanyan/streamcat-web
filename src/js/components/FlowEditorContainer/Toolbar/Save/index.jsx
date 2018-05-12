import React from 'react'

const Save = (props) => {
  const {onClick} = props;
  return <button type="button" className="btn btn-default btn-sm save" onClick={(e)=>onClick(e)}>
    <div className="icon">
      <i className="icon material-icons">&#xE2C2;</i>
    </div>
    <div className="text">
      保存
    </div>
  </button>
}

export default Save
