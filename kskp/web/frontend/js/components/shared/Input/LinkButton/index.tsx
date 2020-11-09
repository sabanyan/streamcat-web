import * as React from "react";
import * as style from "./style.scss";

interface Props{
  children: React.ReactNode;
  onClick?: (e: React.SyntheticEvent<any, Event>)=>void;
  url?: string;
}

const LinkButton = (props: Props) => {
  const {children,onClick,url} = props;
  return <a className={style.linkButton} href={(url)?url:"javascript:return false;"} onClick={onClick}>
    {children}
  </a>;
};

export {LinkButton};
