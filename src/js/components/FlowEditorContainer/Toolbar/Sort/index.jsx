import React from 'react'
import style from '../style.scss'

const Sort = (props) => {
  const {onClick} = props;
  return <button type="button" className="btn btn-default btn-sm layout" onClick={(e)=>onClick(e)}>
    <div className="icon">
      <i className="icon material-icons">&#xE42A;</i>
    </div>
    <div className="text">
      整列
    </div>
  </button>
}

export default Sort
