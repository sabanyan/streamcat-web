import React from 'react';
import * as style from "./style.scss";
import {FlatButton} from "Shared/Input";
import { TrashAllButton } from 'Components/LibraryContainer/TrashAllButton';
import { TrashType } from 'Model/Library';

interface Props {
    trashFolder: TrashType;
    onSuccess: () => void;
}

const TrashMenuList = (props: Props) => {
    const {trashFolder, onSuccess} = props;

    return <div className={style.menuList}>
        <TrashAllButton large={true} trashFolder={trashFolder} onSuccess={onSuccess}/>
    </div>;
};

export {TrashMenuList};
