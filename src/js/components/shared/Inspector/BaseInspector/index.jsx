//@flow
import * as React from 'react'
import style from '../style.scss'
import InOutConnector from '../CommandInspector/InOutConnector/index'

type Props = {
  id?:string;
  label?:string;
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

    const {header,id, label, children,onBlurTitle} = this.props

    const title = (label)?label:id
    let labelContainer
    labelContainer =  <input type="text" ref={"title"} onBlur={(onBlurTitle)?(e)=>onBlurTitle(e):null} className={style.title} defaultValue={title} disabled={((!onBlurTitle)?true:false)}></input>

    return <div className={style.property_container}>
      <div className={style.property_header}>
        {header}
      </div>
      <div className={style.property_body}>
        <div className={style.property_title}>
          {labelContainer}
        </div>
        {children}
      </div>
    </div>
  }


}

export default BaseInspector