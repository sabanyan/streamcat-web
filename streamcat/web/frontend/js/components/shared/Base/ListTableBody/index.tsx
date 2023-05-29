import React from 'react';
import classnames from 'classnames';
import style from './style.scss';

type Props<TDatumType> = {
    bodies: TDatumType[];
    selectedDatas: [TDatumType[], (value:React.SetStateAction<TDatumType[]>)=>void];
    listTableRow: (body: TDatumType) => React.JSX.Element;
    enableMultiSelect: boolean;
}

export const ListTableBody = <TDatumType extends {uuid:string},>(props: Props<TDatumType>) => {
    const { bodies, listTableRow, enableMultiSelect } = props;

    // 選択中の行を保持する
    const [selectedDatas, setSelectedDatas] = props.selectedDatas;

    const onClickCell = (selectedDatum: TDatumType, event: React.MouseEvent<HTMLTableRowElement>): void => {
        // リストボディへのクリックイベントを親コンポーネントに伝搬させないことで
        // ListTableBodyの選択状態を維持する
        event.stopPropagation();        

        if (event && (event.metaKey || event.ctrlKey) && enableMultiSelect) {
            // command or ctrl + click
            if (selectedDatas.includes(selectedDatum)) {
                // 既に選択状態の場合は選択を解除する
                setSelectedDatas(
                    selectedDatas.filter(d => d.uuid !== selectedDatum.uuid)
                );
            } else {
                // 選択したDatumを追加する
                setSelectedDatas([
                    ...selectedDatas, selectedDatum
                ])
            }
        } else if (event && event.shiftKey && enableMultiSelect) {
            // shift + click
            if (selectedDatas.length > 0) {
                // 最後に選択したDatum
                const lastSelectedDatum = selectedDatas[0];
                const curr_index = bodies.findIndex(body => selectedDatum.uuid === body.uuid);
                const last_index = bodies.findIndex(body => lastSelectedDatum.uuid === body.uuid);
                // 最後に選択したDatumから現在選択したDatumまでを選択状態にする
                setSelectedDatas(
                    bodies.slice(Math.min(curr_index, last_index), Math.max(curr_index, last_index) + 1)
                );
            }
        } else {
            // 単一選択
            setSelectedDatas([selectedDatum]);
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
