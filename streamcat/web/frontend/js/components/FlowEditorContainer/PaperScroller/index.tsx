import React from 'react';
import {useState} from "react";
import { useDispatch } from 'react-redux';
import style from "./style.scss";
import {DetectUtil, GraphUtil} from "Utils/index";
import {CommandStepModel, DataFrameStepModel, SubFlowStepModel} from "Model/index";
import {DragType, GraphType, HistoryType} from "Types/index";
import {
    graphUtil,
    pasteStepsAction
} from 'Modules/flowEditor';
import { CommandNodeType, FrameNodeType } from 'Model/Step/NodeTypes';
import { AllNodeType, Flow, FlowType } from 'Model/Library';

type Props = {
    canvasWidth: number;
    deleteSteps: (step_ids: string[]) => void;
    selectSteps: (selected_steps: any[]) => void;
    addHistory: () => void;
    redo: () => void;
    undo: () => void;
    selectedStepIds: string[];
    // nodes: AllNodeType[];
    flowData: Flow;
    zoom: number
    history: HistoryType;
    // drag: DragType | {};
    flowState: [FlowType, (value:React.SetStateAction<FlowType>)=>void];
    graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    dragRangeState: [DragType|null, (value:React.SetStateAction<DragType|null>)=>void];
    children: React.ReactNode;
}

const PaperScroller = (props: Props) => {
    const dispatch = useDispatch();

    const [graph, setGraph] = props.graphState;
    const [dragRange, setDragRange] = props.dragRangeState;

    // const [coords, setCoords] = useState<{x:number, y:number}>();
    const pasteSteps = () => {
        const {flowData} = props;
        const [flow, setFlow] = props.flowState;
        const pasteSteps = (paste_nodes:string) => {
            pasteStepsAction(flowData, paste_nodes);
            setGraph(graphUtil.getGraph(flowData.nodes, props.zoom));
            setFlow({...flow});
        };
        navigator.clipboard.readText().then(data => {
            pasteSteps(data);
        }, (err) => {
            alert("クリップボードが利用できません");
        });
    };

    const getCopyNodes = (): string => {
        const {selectedStepIds, flowData} = props;
        return JSON.stringify(selectedStepIds.map((id) => {
            return GraphUtil.getNode(flowData.nodes, id);
        }));
    };

    /**
     * コピー可能なステップの判断（コマンド or サブフロー を1つのみ）
     * @returns {boolean}
     */
    const copyableStep = () => {
        const {selectedStepIds, flowData} = props;

        if (selectedStepIds.length !== 1) return false;

        if(selectedStepIds.length){
            const targetNode = GraphUtil.getNode(flowData.nodes, selectedStepIds[0]);
            if (targetNode.type === 'flow' || targetNode.type === 'command') {
                return true;
            }
        }
        return false;
    };

    const copySteps = () => {
        if (!copyableStep()) {
            navigator.clipboard.writeText("");
            return;
        }

        const {selectedStepIds} = props;
        const copyData = getCopyNodes();
        navigator.clipboard.writeText(copyData).then(() => {
            // copySteps(selectedStepIds);
        }, (err) => {
            alert("クリップボードが利用できません");
        });
    };

    const deleteSteps = () => {
        const {selectedStepIds, deleteSteps} = props;
        deleteSteps(selectedStepIds);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const {history, redo, undo} = props;
        const current = history.current;
        const max = history.flows.length;

        const redoDisabled = !(current + 1 < max);
        const undoDisabled = !(current - 1 >= 0);

        if (DetectUtil.isMac()) {
            if (e.metaKey && e.key === "c") {
                copySteps();
                return;
            }
            if (e.metaKey && e.key === "v") {
                pasteSteps();
                return;
            }
            if (e.metaKey && e.shiftKey && e.key === "z") {
                if (!redoDisabled) redo();
                return;
            }
            if (e.metaKey && e.key === "z") {
                if (!undoDisabled) undo();
                return;
            }
        } else {
            if (e.ctrlKey && e.key === "c") {
                copySteps();
                return;
            }
            if (e.ctrlKey && e.key === "v") {
                pasteSteps();
                return;
            }
            if (e.ctrlKey && e.shiftKey && e.key === "z") {
                if (!redoDisabled) redo();
                return;
            }
            if (e.ctrlKey && e.key === "z") {
                if (!undoDisabled) undo();
                return;
            }
        }

        if (e.key === "Backspace" || e.key === "Delete") {
            deleteSteps();
        }
    };

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const {selectSteps} = props;
        const dragStart = (x: number, y: number) => {
            // dispatch(dragStartAction(x, y));
            setGraph({
                ...graph,
                width: (x > graph.width) ? x : graph.width,
                height: (y > graph.height) ? y : graph.height
            });
            setDragRange({
                start: {
                    x: x,
                    y: y
                },
                end: {
                    x: x,
                    y: y
                }
            });
        };
        if (isOnClickPaper(e) && !e.shiftKey) {
            // 規定の要素からのカーソル座標値を求めるためには
            // https://qiita.com/yukiB/items/cc533fbbf3bb8372a924
            const target_rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - target_rect.left;
            const y = e.clientY - target_rect.top;

            selectSteps([]);
            dragStart(x, y);
            // setCoords({
            //     x: x,
            //     y: y
            // });
        }
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        // const {drag} = props;
        const dragging = (x: number, y: number) => {
            // dispatch(draggingAction(x, y));
            setGraph({
                ...graph,
                width: (x > graph.width) ? x : graph.width,
                height: (y > graph.height) ? y : graph.height
            });
            setDragRange({
                start: {
                    x: dragRange?.start.x || x,
                    y: dragRange?.start.y || y
                },
                end: {
                    x: x,
                    y: y
                }
            });
        };
        // if(drag.hasOwnProperty('start')){
        if(dragRange){
            const target_rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - target_rect.left;
            const y = e.clientY - target_rect.top;
            dragging(x, y);
        }
    };

    const onMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const {addHistory} = props;
        const dragEnd = (x: number, y: number) => {
            // dispatch(dragEndAction(x, y));
            setDragRange(null);
        };

        // if(drag.hasOwnProperty('start')){
        //     if(drag.hasOwnProperty('end')){
        if(dragRange){
            if(dragRange.start.x!==dragRange.end.x || dragRange.start.y!==dragRange.end.y){
                const target_rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - target_rect.left;
                const y = e.clientY - target_rect.top;
                dragEnd(x, y);
            }
            addHistory();
        }
    };

    const isOnClickPaper = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        //e._dispatchListeners.length は step がクリックされた場合は 2 それ以外は 1
        // return (e._dispatchListeners.length == 1);

        // TODO: _dispatchListenersが存在しなくなったので応急的に対応した
        return 'nodeName' in e.target && (e.target['nodeName']==='svg' || e.target['nodeName']==='DIV');
    };

    const {canvasWidth, children} = props;
    // onKeyDownには tabIndex が必要
    // ref:https://stackoverflow.com/questions/43503964/onkeydown-event-not-working-on-divs-in-react
    return <div tabIndex={0} onKeyDown={(e) => onKeyDown(e)}
                onMouseDown={(e) => onMouseDown(e)}
                onMouseMove={(e) => onMouseMove(e)}
                onMouseUp={(e) => onMouseUp(e)}
                className={style.paper_scroller}
                style={{width: canvasWidth}}>
        {children}
    </div>;
};


export {PaperScroller};
