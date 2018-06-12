import React from 'react'
import style from '../style.scss'

const Suspend = (props) => {
  const {onClick} = props;
  return <button type="button" className="btn btn-default btn-sm abort" disabled={true}>
    <div className={style.icon}>
      <i className="icon material-icons">&#xE034;</i>
    </div>
    <div className={style.text}>
      実行を中止
    </div>
  </button>
}

export default Suspend
