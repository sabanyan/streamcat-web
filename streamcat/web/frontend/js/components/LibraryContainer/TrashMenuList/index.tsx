import React from 'react';
import * as style from "./style.scss";
import { TrashAllButton } from 'Shared/Button/TrashAllButton';
import { TrashType } from 'Model/Library';

type Props = {
    trashFolder: TrashType;
    onSuccess: (newDatum:TrashType) => void;
}

const TrashMenuList = (props: Props) => {
    const {trashFolder, onSuccess} = props;

    return <div className={style.menuList}>
        <TrashAllButton large={true} trashFolder={trashFolder} onSuccess={()=>onSuccess(trashFolder)}/>
    </div>;
};

export {TrashMenuList};
