import React from 'react'
import style from '../style.scss'

const Download = (props) => {
  const {onClick} = props;
  return  <button type="button" className="btn btn-default btn-sm download" disabled={true}>
    <div className="icon">
      <i className="icon material-icons">&#xE2C4;</i>
    </div>
    <div className="text">
      ダウンロード
    </div>
  </button>
}

export default Download