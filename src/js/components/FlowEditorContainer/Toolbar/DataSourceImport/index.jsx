import React from 'react'
import style from '../style.scss'

const DataSourceImport = (props) => {
  const {onClick} = props;
  return  <button type="button" className="btn btn-default btn-sm download" onClick={(e)=>onClick(e)}>
    <div className={style.icon}>
      <i className="material-icons">&#xE2C4;</i>
    </div>
    <div className={style.text}>
      データソースの追加
    </div>
  </button>
}

export default DataSourceImport