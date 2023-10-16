import React from 'react';
import style from './style.scss';
import {DetectUtil, FlowUtil} from 'Utils/index';
import {DragType, GraphType} from 'Types/index';
import {
    graphUtil,
    pasteNodesAction
} from 'Modules/flowEditor';
import { AllNodeType, Flow, FlowType } from 'Model/Library';

type Props = {
    canvasWidth: number;
    deleteNodes: (nodeIds: string[]) => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    addHistory: () => void;
    redo: () => void;
    undo: () => void;
    selectedNodeIds: string[];
    // nodes: AllNodeType[];
    flowData: Flow;
    zoom: number;
    readOnly: boolean;
    // drag: DragType | {};
    flowState: [FlowType, (value:React.SetStateAction<FlowType>)=>void];
    graphState: [GraphType, (value:React.SetStateAction<GraphType>)=>void];
    dragRangeState: [DragType|null, (value:React.SetStateAction<DragType|null>)=>void];
    children: React.ReactNode;
};

const PaperScroller = (props: Props) => {
    const [graph, setGraph] = props.graphState;
    const [dragRange, setDragRange] = props.dragRangeState;

    const getFromStrage = () => {
        return window.localStorage.getItem('SCat-Nodes');
    };

    const setToStrage = (storedText:string) => {
        try{
            return window.localStorage.setItem('SCat-Nodes', storedText);
        }catch(e){
            if(e instanceof DOMException){
                console.warn(`web storage warning: ${e.message}`);
            }
            throw e;
        }
    };

    /**
     * JSON文字列に変換する
     * @param selectedNodeIds 
     * @returns 
     */
    const stringifyNodes = (selectedNodeIds:string[]): string => {
        const {flowData} = props;
        return JSON.stringify(
            selectedNodeIds.map(id => FlowUtil.getNode(flowData.nodes, id))
        );
    };

    /**
     * コピー可能なNodeの判断（コマンド or サブフロー を1つのみ）
     * @returns {boolean}
     */
    const nodeIsCopyable = (selectedNodeIds:string[]) => {
        const {flowData} = props;
        // 全てのNodeが複製可能なtypeであること
        const copyNodes = selectedNodeIds.map(nodeId => FlowUtil.getNode(flowData.nodes, nodeId));
        // 以下のtypeのNodeを複製可能とする
        return copyNodes.every(node =>
            node.type==='command' || node.type==='flow' || node.type==='note' || node.type==='frame'
        );
    };

    const copyNodes = () => {
        const {selectedNodeIds} = props;

        if (!nodeIsCopyable(selectedNodeIds)) {
            setToStrage('');
            return;
        }
        // 選択中のノードをノードJSON文字列に変換する
        const stringifiedNodes = stringifyNodes(selectedNodeIds);
        // WebストレージにノードJSONを保存する
        setToStrage(stringifiedNodes);
    };

    const pasteNodes = () => {
        const {flowData, readOnly, addHistory, selectNodes: selectNodes} = props;
        const [flow, setFlow] = props.flowState;

        // 読み取り専用の場合はペースト不可
        if(readOnly){
            return;
        }
        
        // WebストレージからノードJSONを取得する
        const stringifiedNodes = getFromStrage();
        // コピーするJSONが空の場合はペースト処理をしない
        if(!stringifiedNodes){
            return;
        }

        // ペーストする
        const pastedNodes = pasteNodesAction(flowData, stringifiedNodes);
        setGraph(graphUtil.getGraph(flowData.nodes, props.zoom));
        setFlow({...flow});
        // Undoスタックに履歴を追加する
        addHistory();
        // ペーストしたノードを選択状態にする
        selectNodes(pastedNodes);    
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const {redo, undo, selectedNodeIds, deleteNodes, addHistory} = props;

        if (DetectUtil.isMac()) {
            if (e.metaKey && e.key === 'c') {
                copyNodes();
                return;
            }
            if (e.metaKey && e.key === 'v') {
                pasteNodes();
                return;
            }
            if (e.metaKey && e.shiftKey && e.key === 'z') {
                redo();
                return;
            }
            if (e.metaKey && e.key === 'z') {
                undo();
                return;
            }
        } else {
            if (e.ctrlKey && e.key === 'c') {
                copyNodes();
                return;
            }
            if (e.ctrlKey && e.key === 'v') {
                pasteNodes();
                return;
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'z') {
                redo();
                return;
            }
            if (e.ctrlKey && e.key === 'z') {
                undo();
                return;
            }
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {
            deleteNodes(selectedNodeIds);
            addHistory();
        }
    };

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const {selectNodes} = props;
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

            selectNodes([]);
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
        //e._dispatchListeners.length は node がクリックされた場合は 2 それ以外は 1
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
