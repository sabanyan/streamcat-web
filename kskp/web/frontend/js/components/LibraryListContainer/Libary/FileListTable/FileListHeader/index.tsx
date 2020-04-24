import * as React from "react";

export interface ITableHeader {
    name: string;
    key: string;
}

interface Props {
    headers: ITableHeader[];
    onClick: (header: ITableHeader) => void;
}

const FileListHeader = (props: Props) => {

    const {headers, onClick} = props;

    const headerElement = headers.map(header => {
        return <th onClick={() => {
            onClick(header);
        }}>{header.name}</th>;
    });

    return <thead>
    <tr>
        {headerElement}
    </tr>
    </thead>;
};

export {FileListHeader};
