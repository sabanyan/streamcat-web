import React from "react";
import style from "./style.scss";
import classnames from "classnames";
import {ToolBarButtonType} from "Types/index";

const ToolBarButton = (props: ToolBarButtonType) => {

  const {onClick, children, disabled, icon, is_paper_toolbar_button} = props
  const icon_class = classnames('material-icons', [style.icon])
  return <button type="button" className={(is_paper_toolbar_button)
    ? style.paper_toolbar_button
    : style.flow_toolbar_button} style={props.style} disabled={disabled} onClick={onClick}>
    <i className={icon_class} dangerouslySetInnerHTML={{__html: icon}}></i>
    <div className={style.text}>
      {children}
    </div>
  </button>
}
export {ToolBarButton}
