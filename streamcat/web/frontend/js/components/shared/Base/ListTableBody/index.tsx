import React from 'react';
import classnames from 'classnames';
import { ListTableBodyBase } from '../ListTableBodyBase';
import style from '../ListTableBodyBase/style.scss';

type Props<TDatumType> = {
    allDatas: TDatumType[];
    selectedDatas: [TDatumType[], (value:React.SetStateAction<TDatumType[]>)=>void];
    createRowData: (datum:TDatumType) => React.JSX.Element;
    enableMultiSelect: boolean;
};

export const ListTableBody = <TDatumType extends {uuid:string},>(props: Props<TDatumType>) => {
    const { allDatas, selectedDatas, createRowData, enableMultiSelect } = props;

    const createRow = (datum:TDatumType, selected:boolean, trProps:{}) => {
        return <tr  key={datum.uuid}
                    className={classnames({[style.selected]:selected})}
                    {...trProps} >
            {createRowData(datum)}
        </tr>;
    };

    return <ListTableBodyBase
        allDatas={allDatas}
        selectedDatas={selectedDatas}
        createRow={createRow}
        enableMultiSelect={enableMultiSelect} />;
};
