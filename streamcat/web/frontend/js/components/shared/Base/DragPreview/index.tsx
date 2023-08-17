import React from 'react';
import { useMyDragLayer } from './hooks';
import style from './style.scss';

// 参考元
// https://qiita.com/s_kido14/items/d506805b40da3eb514ad
// 

type Props<TItem> = {
    children: (items:TItem[]) => React.JSX.Element;
};

export const DragPreview = <TItem,>(props:Props<TItem>) => {
    const { items, isDragging, x, y } = useMyDragLayer<TItem>();

    // ドラッグ状態でない場合はドラッグプレビューを返さない
    if (!isDragging) {
        return <></>;
    }

    // ドラッグプレビュー
    return <div className={style.dragPosition}
                style={{transform: `translate(${x}px, ${y}px)`}}>
        <div className={style.dragPreview}>{props.children(items)}</div>
    </div>;
};
