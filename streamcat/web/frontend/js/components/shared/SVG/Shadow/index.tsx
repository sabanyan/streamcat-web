import React from "react";

const Shadow = () => {
    /**
     * https://kadoppe.com/archives/2012/03/svg-drop-shadow.html
     * @returns {XML}
     */
    return (
        <defs>
            <filter id="default-shadow" x="-50%" y="-50%" width="200%"
                    height="200%">
                <feComponentTransfer in="SourceAlpha">
                    <feFuncR type="discrete" tableValues="0.4" />
                    <feFuncG type="discrete" tableValues="0.4" />
                    <feFuncB type="discrete" tableValues="0.4" />
                </feComponentTransfer>
                <feGaussianBlur stdDeviation="3" />
                <feOffset dx="0" dy="1" result="shadow" />
                <feComposite in="SourceGraphic" in2="shadow" operator="over" />
            </filter>
        </defs>
    );
};

export {Shadow};
