import React from 'react';
import * as style from './style.scss';

type Props = {
    children: React.ReactNode;
};

export const Text = (props: Props) => {
    const {children} = props;
    return <div className={style.text}>
        {children}
    </div>;
};
