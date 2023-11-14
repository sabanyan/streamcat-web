import React from 'react';
import style from './style.scss';
import classnames from 'classnames';

type Props = {
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    children: string;
    disabled?: boolean;
}

const FilterCategoryItem = (props: Props) => {
    const {onClick, children, disabled} = props;
    return <div className={classnames(style.categoryItem,{[style.disabled]:disabled})} onClick={onClick}>
        {children}
    </div>;
};

export {FilterCategoryItem};
