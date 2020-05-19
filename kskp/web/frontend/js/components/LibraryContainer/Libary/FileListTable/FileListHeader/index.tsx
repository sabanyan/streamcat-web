import * as React from "react";
import style from "Shared/Input/FlatButton/style.scss";

export interface ITableHeader {
    label: string;
    key: string;
    width?: number;
    sort?: TTableHeaderSortType;
}

export type TTableHeaderSortType = "asc" | "desc" | null | undefined

interface Props {
    headers: ITableHeader[];
    onClick: (header: ITableHeader,event?:React.MouseEvent<HTMLTableHeaderCellElement>) => void;
}

const FileListHeader = (props: Props) => {

    const {headers, onClick} = props;

    const getIconFromSort = (sort?: TTableHeaderSortType): string | null => {
        switch (sort) {
            case  "asc":
                return "icon-arrow-up";
            case "desc":
                return "icon-arrow-down";
            default:
                return null;
        }
    };

    const getIconElement = (icon: string | null) => {
        const baseUrl = "/front_static/";
        const iconElement = (icon)
            ? <img className={style.icon} src={baseUrl + "images/icon/" + icon + ".svg"} />
            : null;
        return iconElement;
    };

    const headerElement = headers.map((header,index) => {
        return <th key={index} onClick={(event) => {
            onClick(header,event);
        }} style={{width: header.width}}>{header.label}{getIconElement(getIconFromSort(header.sort))}</th>;
    });

    return <thead>
    <tr>
        {headerElement}
    </tr>
    </thead>;
};

export {FileListHeader};
