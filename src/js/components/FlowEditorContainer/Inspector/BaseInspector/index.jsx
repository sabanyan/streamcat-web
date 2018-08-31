//@flow
import * as React from 'react'
import style from '../style.scss'
import InOutConnector from '../CommandInspector/InOutConnector'

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
    const e = {
      target:{
        value: this.refs.title.value
      }
    }
    if(this.props.onBlurTitle)this.props.onBlurTitle(e)
  }

  render () {

    const {header, title, children} = this.props

    return <div className={style.property_container}>
      <div className={style.property_header}>
        {header}
      </div>
      <div className={style.property_body}>
        <div className={style.property_title}>
          <input type="text" ref={"title"} onBlur={(e)=>this.onBlurTitle(e)} className={style.title} defaultValue={title}></input>
        </div>
        {children}
      </div>
    </div>
  }

}

export default BaseInspector