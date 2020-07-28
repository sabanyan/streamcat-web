import * as React from "react";
import {useEffect, useRef} from "react";
import style from "../style.scss";
import classnames from "classnames";

interface Props {
    label?: string | null;
    subLabel?: string;
    header?: string;
    title?: (string | React.ReactNode);
    children?: React.ReactNode;
    onBlurTitle?: Function;
    onHide?: Function;
    disabled?: boolean;
}

const BaseInspector = (props: Props) => {
    const inputEl = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            //unmount
            const {label, onBlurTitle, onHide} = props;
            if(inputEl.current){
                if (onBlurTitle && inputEl.current.value) {
                    if (inputEl.current.value != label) {
                        const e = {
                            target: {
                                value: inputEl.current.value
                            }
                        };
                        onBlurTitle(e, props);
                    }
                }
            }
            if (onHide) {
                onHide();
            }
        };
    },[]);


    const {header, label, children, onBlurTitle, subLabel, disabled} = props;
    const _disabled = (!onBlurTitle || disabled);
    let labelContainer, subLabelContainer;
    if (onBlurTitle && label !== undefined) {
        labelContainer = <input key={label || undefined}
                                type="text" ref={inputEl}
                                onBlur={(onBlurTitle) ? (e) => {
                                    onBlurTitle(e, props);
                                } : undefined}
                                className={classnames(style.label, style.clickable)}
                                defaultValue={label || undefined}
                                disabled={_disabled} />;
    } else {
        labelContainer = <div className={style.label}>{label}</div>;
    }
    if (subLabel) {
        subLabelContainer = <div>
            {subLabel}
        </div>;
    }

    return <div className={classnames(style.property_container, "inspector-container")}>
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
    </div>;
};

export {BaseInspector};

