//@flow
import * as React from 'react'
import style from '../style.scss'
import InOutConnector from '../CommandInspector/InOutConnector/index'

type Props = {
  header?: string;
  title?: (string|React.Node);
  children?: React.Node;
  onBlurTitle?: Function;
}

class BaseInspector extends React.Component<Props> {

  onBlurTitle(e:SyntheticInputEvent<EventTarget>){
    if(this.props.onBlurTitle)this.props.onBlurTitle(e)
  }

  componentWillUnmount(){
    if(this.props.onBlurTitle){
      const e = {
        target:{
          value: this.refs.title.value
        }
      }
      this.props.onBlurTitle(e)
    }
  }

  render () {

    const {header, title, children,onBlurTitle} = this.props

    let titleContainer = <div>title</div>
    if(onBlurTitle){
      titleContainer =  <input type="text" ref={"title"} onBlur={(e)=>onBlurTitle(e)} className={style.title} defaultValue={title}></input>
    }

    return <div className={style.property_container}>
      <div className={style.property_header}>
        {header}
      </div>
      <div className={style.property_body}>
        <div className={style.property_title}>
          {titleContainer}
        </div>
        {children}
      </div>
    </div>
  }

}

export default BaseInspector