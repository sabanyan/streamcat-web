//@flow
import * as React from 'react'
import style from '../style.scss'
import InOutConnector from '../CommandInspector/InOutConnector/index'

type Props = {
  name?:string;
  label?:string;
  subLabel?:string;
  header?: string;
  title?: (string|React.Node);
  children?: React.Node;
  onBlurTitle?: Function;
  onHide?: Function;
}

class BaseInspector extends React.Component<Props> {

  onBlurTitle(e:SyntheticInputEvent<EventTarget>){
    if(this.props.onBlurTitle)this.props.onBlurTitle(e)
  }

  componentWillUnmount(){
    if(this.props.onBlurTitle && this.refs["title"]){
      const e = {
        target:{
          value: this.refs.title.value
        }
      }
      this.props.onBlurTitle(e)
    }
    if(this.props.onHide){
      this.props.onHide()
    }
  }

  render () {

    const {header,name, label, children,onBlurTitle,subLabel} = this.props

    const disabled = (!onBlurTitle)
    let labelContainer,subLabelContainer

    if(!disabled){
      labelContainer =  <input type="text" ref={"title"} onBlur={(onBlurTitle)?(e)=>onBlurTitle(e):null} className={style.label} defaultValue={label} disabled={disabled}></input>
    }
    if(subLabel){
      subLabelContainer = <div>
          {subLabel}
        </div>
    }

    return <div className={style.property_container}>
      <div className={style.property_header}>
        {header}
      </div>
      <div className={style.property_body}>
        <div className={style.property_label}>
          {labelContainer}
          {subLabelContainer}
        </div>
        {/*<div className={style.property_name}>*/}
          {/*{name}*/}
        {/*</div>*/}
        {children}
      </div>
    </div>
  }


}

export default BaseInspector