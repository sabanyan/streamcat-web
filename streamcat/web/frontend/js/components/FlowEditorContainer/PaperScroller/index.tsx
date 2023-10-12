import React from 'react';
import style from './style.scss';
import {DetectUtil, GraphUtil} from 'Utils/index';
import {DragType, GraphType} from 'Types/index';
import {
    graphUtil,
    pasteStepsAction
} from 'Modules/flowEditor';
import { Flow, FlowType } from 'Model/Library';
import { FlowNodeType } from 'Model/Step/NodeTypes';

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
    // drag: DragType | {};
    flowState: [FlowType, (value:React.SetStateAction<FlowType>)=>void];
    graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    dragRangeState: [DragType|null, (value:React.SetStateAction<DragType|null>)=>void];
    children: React.ReactNode;
}

const PaperScroller = (props: Props) => {

    const [graph, setGraph] = props.graphState;
    const [dragRange, setDragRange] = props.dragRangeState;

    const stringifyNodes = (selectedStepIds:string[]): string => {
        const {flowData} = props;
        return JSON.stringify(
            selectedStepIds.map(id => GraphUtil.getNode(flowData.nodes, id))
        );
    };

    /**
     * コピー可能なステップの判断（コマンド or サブフロー を1つのみ）
     * @returns {boolean}
     */
    const stepIsCopyable = () => {
        const {selectedStepIds, flowData} = props;

        // 複数のノードをコピーさせない
        if(selectedStepIds.length !== 1){
            return false
        }

        const copyNode = GraphUtil.getNode(flowData.nodes, selectedStepIds[0]);
        if(copyNode.type === 'flow'){
            const flowNode = copyNode as FlowNodeType;
            if(flowNode.classification === 'data_source' || flowNode.classification === 'data_dest'){
                return false;
            }
        }else if(copyNode.type !== 'command'){
            return false;
        }

        // Command、またはデータソース/デスト以外のFlow
        return true;
    };

    const copySteps = () => {
        const {selectedStepIds} = props;

        if (!stepIsCopyable()) {
            navigator.clipboard.writeText("");
            return;
        }

        const stringifiedNodes = stringifyNodes(selectedStepIds);
        navigator.clipboard.writeText(stringifiedNodes).then(
            () => {},
            () => alert("クリップボードが利用できません")
        );
    };

    const pasteSteps = () => {
        const {flowData} = props;
        const [flow, setFlow] = props.flowState;

        navigator.clipboard.readText().then(
            stringifiedNodes => {
                // コピーするJSONが空の場合はペースト処理をしない
                if(stringifiedNodes === ''){
                    return;
                }
                pasteStepsAction(flowData, stringifiedNodes);
                setGraph(graphUtil.getGraph(flowData.nodes, props.zoom));
                setFlow({...flow});
            },
            () => alert("クリップボードが利用できません")
        );
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const {redo, undo, selectedStepIds, deleteSteps, addHistory} = props;

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
                redo();
                return;
            }
            if (e.metaKey && e.key === "z") {
                undo();
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
                redo();
                return;
            }
            if (e.ctrlKey && e.key === "z") {
                undo();
                return;
            }
        }

        if (e.key === "Backspace" || e.key === "Delete") {
            deleteSteps(selectedStepIds);
            addHistory();
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
        const dragEnd = () => {
            setDragRange(null);
        };

        // if(drag.hasOwnProperty('start')){
        //     if(drag.hasOwnProperty('end')){
        if(dragRange){
            if(dragRange.start.x!==dragRange.end.x || dragRange.start.y!==dragRange.end.y){
                dragEnd();
            }
            // FIXME: コマンドオプションの編集処理などに履歴追加処理が実装されてないようなので
            // Canvasのクリック時に履歴を追加する必要がある
            addHistory();
        }

    };

    const onMouseClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        // Click時には範囲選択を解除させる
        const dragEnd = () => {
            setDragRange(null);
        }
        dragEnd();
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
                onClick={e => onMouseClick(e)}
                className={style.paper_scroller}
                style={{width: canvasWidth}}>
        {children}
    </div>;
};


export {PaperScroller};
