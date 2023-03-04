import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';
import style from './style.scss';

type Props = {
    zoom: number;
    setZoom: Function;
    disabled: boolean;
};

export const Zoom = (props: Props) => {
    const {zoom, setZoom, disabled} = props;

    const onClickZoomIn = (e: React.MouseEvent) => {
        setZoom({ offset: 10 });
    };

    const onClickZoomOut = (e: React.MouseEvent) => {
        setZoom({ offset: -10 });
    };

    const onClickDefaultZoom = (e: React.MouseEvent) => {
        setZoom({ value: 100 });
    };

    return <div className={style.zoom}>
        <ToolBarButton  onClick={onClickZoomIn}
                        disabled={disabled}
                        is_paper_toolbar_button={true}>+</ToolBarButton>
        <ToolBarButton  onClick={onClickDefaultZoom}
                        disabled={disabled}
                        is_paper_toolbar_button={true}>{zoom}%</ToolBarButton>
        <ToolBarButton  onClick={onClickZoomOut}
                        disabled={disabled}
                        is_paper_toolbar_button={true}>-</ToolBarButton>
    </div>;
};
