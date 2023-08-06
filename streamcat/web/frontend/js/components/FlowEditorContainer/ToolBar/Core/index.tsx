import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Note, Redo, Run, Save, Sort, Undo, Zoom } from 'FlowEditorContainer/ToolBar';
import style from './style.scss';
import classnames from 'classnames';
import { Loader } from 'Shared/Base';
import { HistoryType } from 'Types/index';
import { refreshFlowAction, sortFlowAction } from 'Modules/flowEditor';
import { AllNodeType, FlowType } from 'Model/Library';

type ToolBarProps = {
    nodes: any[];
    history: HistoryType;
    // zoom: number;
    zoomState: [number, (value:React.SetStateAction<number>)=>void];
    lockUUID?: string;
    notifyLoading: (title: string, message: string) => string;
    notifiWarning: (title: string, message: string) => string;
    notifyError: (title: string, message: string) => string;
    notifyComplete: (title:string, outLabels:string[], parentFolderUUID:string|null) => string;
    dismissNotify: (id:string) => void;
    addStep: (add_step:AllNodeType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => void;
    addHistory: Function;
    undo: Function;
    redo: Function;
    baseDisabled: boolean
    runDisabled: boolean;
    onClickSaveFlow: () => {};
    onClickRunFlowPromise: any;
};

export const ToolBar = (props: ToolBarProps) => {
    const { nodes,
            history,
            // zoom,
            zoomState,
            lockUUID,
            notifyLoading,
            notifiWarning,
            notifyError,
            notifyComplete,
            dismissNotify,
            addStep,
            addHistory, 
            undo,
            redo, 
            baseDisabled,
            runDisabled,
            onClickSaveFlow,
            onClickRunFlowPromise} = props;

    const [zoom, ] = props.zoomState;

    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const current = history.current;
    const max = history.nodes.length;

    const redoDisabled = !(current + 1 < max);
    const undoDisabled = !(current - 1 >= 0);

    const refreshFlow = (context:FlowType) => {
        dispatch(refreshFlowAction(context, zoom));
    };
    // const setZoom = ({ offset, value }) => {
    //     dispatch(setZoomAction({ offset, value }));
    // };
    const sortFlow = () => {
        dispatch(sortFlowAction(zoom));
    };

    return <div>
        <div className={classnames(style.flow_toolbar)}>
            <Save disabled={baseDisabled}
                  onClick={e => onClickSaveFlow()}>保存</Save>
            <Run refreshFlow={refreshFlow}
                onClickRunFlowPromise={onClickRunFlowPromise}
                setIsLoading={setIsLoading}
                notifyLoading={notifyLoading}
                notifiWarning={notifiWarning}
                notifyError={notifyError}
                notifyComplete={notifyComplete}
                dismissNotify={dismissNotify}
                lockUUID={lockUUID}
                disabled={runDisabled}>このフローを実行</Run>
            <Note zoom={zoom}
                  nodes={nodes}
                  addStep={addStep}
                  addHistory={addHistory}
                  disabled={baseDisabled}>メモ</Note>
            <Undo undo={undo}
                  disabled={baseDisabled || undoDisabled}>もとに戻す</Undo>
            <Redo redo={redo}
                  disabled={baseDisabled || redoDisabled}>繰り返す</Redo>
        </div>
        <div className={classnames(style.paper_toolbar)}>
            <Zoom zoomState={zoomState}
                  disabled={false}/>
            <Sort disabled={baseDisabled}
                  addHistory={addHistory}
                  sortFlow={sortFlow}>整列</Sort>
        </div>
        <Loader whiteBackground={true}
                center={true}
                absolute={true}
                fixed={false}
                visible={isLoading}
                message=''/>
    </div>;
};
