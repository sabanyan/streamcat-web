import { useDragLayer } from 'react-dnd';

export const useSampleDragLayer = () => {
    const { item, isDragging, initialOffset, differenceOffset } = useDragLayer(monitor => ({
        // ドラッグしているアイテムの初期位置を取得
        initialOffset: monitor.getInitialSourceClientOffset(),
        // ドラッグ開始位置から現在のカーソル位置までの差分を取得
        differenceOffset: monitor.getDifferenceFromInitialOffset(),
        // useDragのItemに渡していた要素をここから取得
        item: monitor.getItem(),
        isDragging: monitor.isDragging(),
    }));

    if (!isDragging || !differenceOffset || !initialOffset) {
        return { text: '', isDragging: isDragging, x: 0, y: 0 };
    }

    return {
        text: item.text,
        isDragging: isDragging,
        // 以下でプレビューを表示したい座標を計算
        // スクロールで表示の初期位置がずれてしまうのでwindow.scrollX、window.scrollYで補正
        x: differenceOffset.x + initialOffset.x + window.scrollX,
        y: differenceOffset.y + initialOffset.y + window.scrollY,
    };
};
