import React from "react";
import style from "./style.scss";

type Props = {
    // Module '"csstype"' has no exported member エラーにより、
    // AlignItemsProperty, FlexDirectionProperty, JustifyContentProperty -> anyにhotfix
    children: React.ReactNode
    justifyContent?: any; 
    alignItems?: any;
    flexDirection?: any;
    inline?: boolean;
    fluid?: boolean;
    width?: number | string;
    minWidth?: number | string;
    onClick?: ()=>void;
    onMouseDown?: ()=>void;
    height?: number | string;
    minHeight?: number | string;
}

const Flex = (props: Props) => {
    const {children, justifyContent, alignItems, flexDirection, inline, fluid, width, onClick, height,minHeight, minWidth, onMouseDown} = props;
    return <div className={style.flex}
                style={{
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    flexDirection: flexDirection,
                    display: (inline) ? "inline-flex" : "flex",
                    width: (fluid) ? "100%" : width,
                    height: height,
                    maxWidth: (fluid) ? width : undefined,
                    minWidth: minWidth,
                    minHeight: minHeight
                }}
                onClick={onClick}
                onMouseDown={onMouseDown}>
        {children}
    </div>;
};

export {Flex};
