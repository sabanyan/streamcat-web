import React from 'react'

const DataSourceImport = (props) => {
  const {onClick} = props;
  return  <button type="button" className="btn btn-default btn-sm download" onClick={(e)=>onClick(e)}>
    <div className="icon">
      <i className="icon material-icons">&#xE2C4;</i>
    </div>
    <div className="text">
      データソースの追加
    </div>
  </button>
}

export default DataSourceImport