import React from 'react';
import classnames from 'classnames';
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ListTableBodyBase } from '../ListTableBodyBase';
import style from '../ListTableBodyBase/style.scss';

type Props<TDatumType> = {
    allDatas: TDatumType[];
    selectedDatas: [TDatumType[], (value:React.SetStateAction<TDatumType[]>)=>void];
    createRowData: (datum:TDatumType) => React.JSX.Element;
    canDrop?: (draggingDatas:TDatumType[], targetDatum:TDatumType) => boolean;
    enableMultiSelect: boolean;
};

export const ListTableBodyDnD = <TDatumType extends {uuid:string},>(props: Props<TDatumType>) => {
    const { allDatas, createRowData, enableMultiSelect } = props;

    // 選択中の行を保持する
    const [selectedDatas,] = props.selectedDatas;

    const useDragAndDrop = (datum:TDatumType) => {
        // ドラッグ
        // 選択行またはテーブルの並び順が変更された場合はdragRef等を再生成する必要がある
        const [{isDragging}, dragRef, dragPreview] = useDrag(() => ({
            type: 'Datum',
            item: () => {
                if(selectedDatas.some(selectDatum => selectDatum.uuid===datum.uuid)){
                    // 複数の行が選択されている場合は、それら選択行をドラッグする
                    return selectedDatas;
                }else{
                    return [datum];
                }
            },
            collect: (monitor) => ({
                isDragging: monitor.isDragging()
            })
        }), [selectedDatas, allDatas]);

        // ドロップ
        const [{canDrop}, dropRef] = useDrop<TDatumType[], any, {canDrop:boolean}>(() => ({
            accept: 'Datum',
            canDrop: (item, monitor) => !!props.canDrop && props.canDrop(selectedDatas, datum),
            drop: (item, monitor) => {
                console.log(item, datum.uuid)
            },
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
        enableMultiSelect={enableMultiSelect} />;
};
