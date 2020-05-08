import React from "react";

interface Props {
    children: React.ReactNode;
    onSubmit: () => void;
}

interface State {
}

const InputForm = (props: Props) => {
    const {children, onSubmit} = props;
    return <form onSubmit={onSubmit}>
        {children}
    </form>;
};

export {InputForm}
