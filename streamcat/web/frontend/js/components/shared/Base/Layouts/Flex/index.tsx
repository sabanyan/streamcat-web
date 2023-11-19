import React from "react";
import style from "./style.scss";
// TODO: Visual Studio Codeではエラーになるが、num run buildは通る
// エラーになる原因は不明
import {Property} from 'csstype';

type Props = {
    children?: React.ReactNode;
    justifyContent?: Property.AlignContent;
    alignItems?: Property.AlignItems;
    flexDirection?: Property.FlexDirection;
    inline?: boolean;
    fluid?: boolean;
    width?: number | string;
    minWidth?: number | string;
    onClick?: ()=>void;
    onMouseDown?: ()=>void;
    height?: number | string;
    minHeight?: number | string;
};

export const Flex = (props: Props) => {
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
