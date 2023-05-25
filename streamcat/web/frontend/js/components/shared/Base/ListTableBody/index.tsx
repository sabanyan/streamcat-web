import React from 'react';
import classnames from 'classnames';
import style from './style.scss';

type Props<TDatumType> = {
    bodies: TDatumType[];
    selectedDatas: [TDatumType[], (value:React.SetStateAction<TDatumType[]>)=>void];
    lastSelectedDatum: [TDatumType|null, (value:React.SetStateAction<TDatumType|null>)=>void];
    listTableRow: (body: TDatumType) => React.JSX.Element;
    enableMultiSelect: boolean;
}

export const ListTableBody = <TDatumType extends {uuid:string},>(props: Props<TDatumType>) => {
    const { bodies, listTableRow, enableMultiSelect } = props;

    // 選択中の行を保持する
    const [selectedDatas, setSelectedDatas] = props.selectedDatas;
    // 範囲選択の開始行を保持する
    const [lastSelectedDatum, setLastSelectedDatum] = props.lastSelectedDatum;

    const onClickCell = (selectedDatum: TDatumType, event?: React.MouseEvent<HTMLTableRowElement>): void => {
        if(!selectedDatum){
            return;
        }

        if(event){
            event.stopPropagation();
        }

        if (event && (event.metaKey || event.ctrlKey) && enableMultiSelect) {
            // command or ctrl + click
            if (selectedDatas.includes(selectedDatum)) {
                setSelectedDatas(
                    selectedDatas.filter(d => d.uuid !== selectedDatum.uuid)
                );
            } else {
                selectedDatas.push(selectedDatum);
                setLastSelectedDatum(selectedDatum);
            }
        } else if (event && event.shiftKey && enableMultiSelect) {
            // shift + click
            // 選択状態を一旦解除
            setSelectedDatas([]);
            let current = bodies.findIndex(body => selectedDatum.uuid === body.uuid);
            if (lastSelectedDatum) {
                let last = bodies.findIndex(body => lastSelectedDatum.uuid === body.uuid);
                let min, max;
                if (current >= last) {
                    min = last;
                    max = current;
                } else {
                    min = current;
                    max = last;
                }
                setSelectedDatas(
                    bodies.slice(min, max + 1)
                );
            }
        } else {
            // 単一選択
            setSelectedDatas([selectedDatum]);
            setLastSelectedDatum(selectedDatum);
        }
    };

    return <tbody className={style.listTableBody}>{
        // 1行出力する
        bodies.map((body, index) => {
            const selected = selectedDatas.some(datum => datum.uuid === body.uuid);
            return <tr key={index}
                       className={classnames({[style.selected]: selected})}
                       onClick={e => onClickCell(body,e)}
                       onMouseDown={(event)=>event.stopPropagation()} >
                {listTableRow(body)}
            </tr>;
        })
    }</tbody>;
};
