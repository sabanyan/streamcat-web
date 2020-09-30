import * as React from 'react';
import style from './style.scss';
import classnames from 'classnames';

interface Props {
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    children: string;
}

const FilterCategoryItem = (props: Props) => {
    const {onClick, children} = props;
    return <div className={style.categoryItem} onClick={onClick}>
        {children}
    </div>;
};

export {FilterCategoryItem};
