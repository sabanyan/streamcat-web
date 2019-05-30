//@flow
import * as React from 'react'
import style from '../style.scss'
import classnames from 'classnames'

type Props = {
  label?:string;
  subLabel?:string;
  header?: string;
  title?: (string|React.Node);
  children?: React.Node;
  onBlurTitle?: Function;
  onHide?: Function;
}

class BaseInspector extends React.Component<Props> {

  componentWillUnmount(){
    if(this.props.onBlurTitle && this.refs["title"]){
      const e = {
        target:{
          value: this.refs.title.value
        }
      }
      this.props.onBlurTitle(e,this.props)
    }
    if(this.props.onHide){
      this.props.onHide()
    }
  }


  render () {

    const {header, label, children,onBlurTitle,subLabel} = this.props
    const disabled = (!onBlurTitle)
    let labelContainer,subLabelContainer
    // FIXIT ロジクもう少し分かりやすく
    if(!disabled && label !== undefined){
      labelContainer =  <input type="text" ref={"title"}
                               onBlur={(onBlurTitle)?(e)=>{onBlurTitle(e, this.props)}:null}
                               className={style.label}
                               defaultValue={label}
                               disabled={disabled}></input>
    }
    if(subLabel){
      subLabelContainer = <div>
        {subLabel}
      </div>
    }

    const width = 100

    return <div className={classnames(style.property_container,'inspector-container')}>
      <div className={style.property_header}>
        {header}
      </div>
      <div className={style.property_body}>
        <div className={style.property_label}>
          {labelContainer}
          {subLabelContainer}
        </div>
        {children}
      </div>
    </div>
  }


}

export default BaseInspector