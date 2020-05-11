import React from "react";
import * as style from "./style.scss";
import {AlignItemsProperty, FlexDirectionProperty, JustifyContentProperty} from "csstype";

type Props = {
    children: React.ReactNode
    justifyContent?: JustifyContentProperty;
    alignItems?: AlignItemsProperty;
    flexDirection?: FlexDirectionProperty;
    inline?: boolean;
    fluid?: boolean;
    width?: number;
}

const Flex = (props: Props) => {
    const {children, justifyContent, alignItems, flexDirection, inline, fluid, width} = props;
    return <div className={style.flex}
                style={{
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    flexDirection: flexDirection,
                    display: (inline) ? "inline-flex" : "flex",
                    width: (fluid) ? "100%" : width,
                    maxWidth: (fluid) ? width : undefined
                }}>
        {children}
    </div>;
};

export {Flex};
