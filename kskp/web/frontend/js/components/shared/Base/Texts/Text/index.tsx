import * as React from "react";
import * as style from "./style.scss";

interface Props{
    children: React.ReactNode;
}

const Text = (props: Props) => {
    const {children} = props;
    return <div className={style.text}>
        {children}
    </div>;
};

export {Text};
