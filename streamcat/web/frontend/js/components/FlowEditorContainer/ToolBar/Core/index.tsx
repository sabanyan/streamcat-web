import React, { useState } from 'react';
import { Note, Redo, Run, Save, Sort, Undo, Zoom } from 'FlowEditorContainer/ToolBar';
import style from './style.scss';
import classnames from 'classnames';
import { Loader } from 'Shared/Base';
import { HistoryType } from 'Types/index';

type ToolBarProps = {
    nodes: any[];
    history: HistoryType;
    zoom: number;
    lockUUID?: string;
    notifyLoading: (title: string, message: string) => string;
    notifiWarning: (title: string, message: string) => string;
    notifyError: (title: string, message: string) => string;
    notifyComplete: (title:string, outLabels:string[], parentFolderUUID:string|null) => string;
    dismissNotify: (id:string) => void;
    addStep: Function;
    addHistory: Function;
    sortFlow: Function;
    setZoom: Function;
    undo: Function;
    redo: Function;
    baseDisabled: boolean
    runDisabled: boolean;
    refreshFlow: Function;
    onClickSaveFlow: () => {};
    onClickRunFlowPromise: any;
};

export const ToolBar = (props: ToolBarProps) => {
    const { nodes,
            history,
            zoom,
            lockUUID,
            notifyLoading,
            notifiWarning,
            notifyError,
            notifyComplete,
            dismissNotify,
            addStep,
            addHistory, 
            sortFlow,
            setZoom,
            undo,
            redo, 
            baseDisabled,
            runDisabled,
            refreshFlow,
            onClickSaveFlow,
            onClickRunFlowPromise} = props;

    const [isLoading, setIsLoading] = useState(false);

    const current = history.current;
    const max = history.nodes.length;

    const redoDisabled = !(current + 1 < max);
    const undoDisabled = !(current - 1 >= 0);

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
            <Zoom zoom={zoom}
                  setZoom={setZoom}
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
