import React from 'react';
import style from './style.scss';

type Props<TDatumType> = {
    allDatas: TDatumType[];
    selectedDatas: [TDatumType[], (value:React.SetStateAction<TDatumType[]>)=>void];
    createRow: (datum:TDatumType, selected:boolean, trProps:{}) => React.JSX.Element;
    enableMultiSelect: boolean;
};

export const ListTableBodyBase = <TDatumType extends {uuid:string},>(props: Props<TDatumType>) => {
    const { allDatas, createRow, enableMultiSelect } = props;

    // 選択中の行を保持する
    const [selectedDatas, setSelectedDatas] = props.selectedDatas;

    // 行のクリックで選択中の行を変更する
    const onClickRow = (selectedDatum: TDatumType, event: React.MouseEvent<HTMLTableRowElement>): void => {
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
                const curr_index = allDatas.findIndex(datum => selectedDatum.uuid===datum.uuid);
                const last_index = allDatas.findIndex(datum => lastSelectedDatum.uuid===datum.uuid);
                // 最後に選択したDatumから現在選択したDatumまでを範囲選択する
                setSelectedDatas(
                    allDatas.slice(Math.min(curr_index, last_index), Math.max(curr_index, last_index) + 1)
                );
            }
        } else {
            // 単一選択
            setSelectedDatas([selectedDatum]);
        }
    };

    return <tbody className={style.listTableBody}>{
        allDatas.map((datum, index) => {
            // 選択行の色を変える
            const selected = selectedDatas.some(selectedDatum => selectedDatum.uuid===datum.uuid);
            // 1行出力する
            const trProps = {
                onClick: e => onClickRow(datum,e),
                onMouseDown: (event)=>event.stopPropagation()
            };
            return createRow(datum, selected, trProps);
        })
    }</tbody>;
};
