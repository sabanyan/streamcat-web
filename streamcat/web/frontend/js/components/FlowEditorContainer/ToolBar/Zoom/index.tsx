import React from 'react';
import { useDispatch } from 'react-redux';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';
import style from './style.scss';
import { graphUtil } from 'Modules/flowEditor';
import { Flow } from 'Model/Library';
import { GraphType } from 'Types/index';

type Props = {
    // zoom: number;
    // setZoom: Function;
    zoomState: [number, (value:React.SetStateAction<number>)=>void];
    graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    flowData: Flow;
    disabled: boolean;
};

export const Zoom = (props: Props) => {
    const {flowData, disabled} = props;
    const [zoom, setZoom] = props.zoomState;
    const [graph, setGraph] = props.graphState;

    const dispatch = useDispatch();

    const onClickZoomIn = (e: React.MouseEvent) => {
        zoom < 180 && setZoom(zoom + 10);
        // dispatch(setZoomAction(flowData, zoom + 10));
        setGraph(graphUtil.getGraph(flowData.nodes, zoom + 10));
    };

    const onClickZoomOut = (e: React.MouseEvent) => {
        zoom > 40 && setZoom(zoom - 10);
        // dispatch(setZoomAction(flowData, zoom - 10));
        setGraph(graphUtil.getGraph(flowData.nodes, zoom - 10));
    };

    const onClickDefaultZoom = (e: React.MouseEvent) => {
        setZoom(100);
        // dispatch(setZoomAction(flowData, 100));
        setGraph(graphUtil.getGraph(flowData.nodes, 100));
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
