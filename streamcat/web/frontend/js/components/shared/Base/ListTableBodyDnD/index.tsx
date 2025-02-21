import React from 'react';
import classnames from 'classnames';
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ListTableBodyBase } from '../ListTableBodyBase';
import * as style from '../ListTableBodyBase/style.scss';

type Props<TDatumType> = {
    allDatas: TDatumType[];
    selectedDatas: [TDatumType[], (value:React.SetStateAction<TDatumType[]>)=>void];
    enableMultiSelect: boolean;
    createRowData: (datum:TDatumType) => React.JSX.Element;
    onLoadMore?: (offset:number, limit:number) => Promise<boolean>;
    canDrag: (datas:TDatumType[]) => boolean;
    canDrop?: (draggingDatas:TDatumType[], targetDatum:TDatumType) => boolean;
    doDrop? : (droppedDatas:TDatumType[], targetDatum:TDatumType) => void;
};

export const ListTableBodyDnD = <TDatumType extends {uuid:string},>(props: Props<TDatumType>) => {
    const { allDatas, enableMultiSelect, createRowData, onLoadMore} = props;

    // 選択中の行を保持する
    const [selectedDatas,] = props.selectedDatas;

    const useDragAndDrop = (datum:TDatumType) => {
        // ドラッグ対象のDatumを返す
        const dragDatas = (selectedDatas:TDatumType[]) => {
            if(selectedDatas.some(selectDatum => selectDatum.uuid===datum.uuid)){
                // 複数の行が選択されている場合は、それら選択行をドラッグする
                return selectedDatas;
            }else{
                return [datum];
            }
        };

        // ドラッグ
        // 選択行またはテーブルの並び順が変更された場合はdragRef等を再生成する必要がある
        const [{isDragging}, dragRef, dragPreview] = useDrag(() => ({
            type: 'Datum',
            item: () => dragDatas(selectedDatas),
            // NOTE: canDragがコールバックする関数ではmonitor.getItem()は常にnullを返すようだ
            canDrag: monitor => !!props.canDrag && props.canDrag(dragDatas(selectedDatas)),
            // 複数の行がドラッグされている場合はそれら全てについてtrueを返す
            isDragging: monitor => monitor.getItem().some(item => item.uuid===datum.uuid),
            collect: monitor => ({
                isDragging: monitor.isDragging()
            })
        }), [selectedDatas, allDatas]);

        // ドロップ
        const [{canDrop}, dropRef] = useDrop<TDatumType[], any, {canDrop:boolean}>(() => ({
            accept: 'Datum',
            canDrop: (items, monitor) => !!props.canDrop && props.canDrop(items, datum),
            drop: (items, monitor) => !!props.doDrop && props.doDrop(items, datum),
            collect: (monitor) => ({
                canDrop: !!monitor.isOver() && !!monitor.canDrop()
            }),
        }), [selectedDatas, allDatas]);
        
        // デフォルトのプレビューイメージが表示されないようにする
        React.useEffect(() => {
            dragPreview(getEmptyImage());
        }, []);

        return {
            isDragging: isDragging,
            canDrop: canDrop,
            dragRef: dragRef,
            dropRef: dropRef
        };
    };

    const createRow = (datum:TDatumType, selected:boolean, trProps:{}) => {
        // ドラッグ&ドロップ
        let {isDragging, canDrop, dragRef, dropRef} = useDragAndDrop(datum);

        return isDragging?
            // ドラッグ中の行は表示しない
            <tr key={datum.uuid}><td></td><td></td><td></td></tr>:
            // allDatas配列は並び順が変更され得るので
            // trと状態変数(dragRef,dropRef)の紐付けが損なわれないようkey属性にはUUIDを設定する
            <tr key={datum.uuid}
                // trにdragRefとdropRefを紐付ける
                ref={element => {dragRef(element); dropRef(element);}}
                className={classnames({[style.selected]:selected, [style.canDrop]:canDrop})}
                {...trProps} >
                {createRowData(datum)}
            </tr>;
    };

    return <ListTableBodyBase
        allDatas={allDatas}
        selectedDatas={props.selectedDatas}
        createRow={createRow}
        onLoadMore={onLoadMore}
        enableMultiSelect={enableMultiSelect} />;
};
