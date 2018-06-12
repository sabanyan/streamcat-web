import React from 'react'
import style from './style.css'

export default class TabList extends React.Component {
  render(){
    /**
     * 自動的に子要素に対して tab_id や key を追加する処理
     */
    const children = this.props.children.map((element,index)=>{
      return React.cloneElement(
        element,
        { tab_id: index,key: index}
      );
    })
    return <div className={style.tab_list}>
          {children}
    </div>
  }
}
