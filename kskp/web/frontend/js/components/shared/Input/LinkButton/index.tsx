import * as React from "react";
import * as style from "./style.scss";

interface Props{
  children: React.ReactNode;
  onClick?: (e: React.SyntheticEvent<any, Event>)=>void;
}

const LinkButton = (props: Props) => {
  const {children,onClick} = props;
  return <a className={style.linkButton} href={"#"} onClick={onClick}>
    {children}
  </a>;
};

export {LinkButton};
