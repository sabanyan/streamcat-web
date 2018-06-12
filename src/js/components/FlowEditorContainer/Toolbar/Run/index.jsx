import React from 'react'
import style from '../style.scss'

export default class Run extends React.Component {
  render(){
    const {onClick} = this.props;
    return  <button type="button" className="btn btn-default btn-sm run" onClick={(e)=>onClick(e)}>
      <div className="icon">
        <i className="icon material-icons">&#xE037;</i>
      </div>
      <div className="text">
        プロジェクト実行
      </div>
    </button>
  }
}