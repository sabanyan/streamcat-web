import React from 'react';
import {useState} from "react";
import { useDispatch } from 'react-redux';
import style from "./style.scss";
import {DetectUtil, GraphUtil} from "Utils/index";
import {CommandStepModel, SubFlowStepModel} from "Model/index";
import {DragType, HistoryType} from "Types/index";
import {
    copyStepsAction,
    dragEndAction,
    dragStartAction,
    draggingAction,
    pasteStepsAction
} from 'Modules/flowEditor';

type Props = {
    editor: any;
    deleteSteps: Function;
    selectSteps: Function;
    addHistory: Function;
    redo: Function;
    undo: Function;
    selected_step_ids: string[];
    nodes: any[];
    history: HistoryType;
    drag: DragType | {};
    children: React.ReactNode;
}

const PaperScroller = (props: Props) => {
    const dispatch = useDispatch();

    const [coords, setCoords] = useState<{x:number, y:number}>();
    const pasteSteps = () => {
        const pasteSteps = (paste_nodes: []) => {
            dispatch(pasteStepsAction(paste_nodes));
        };
        navigator.clipboard.readText().then((data: any) => {
            pasteSteps(data);
        }, (err) => {
            alert("クリップボードが利用できません");
        });
    };

    const getCopyNodes = (): string => {
        const {selected_step_ids, nodes} = props;
        return JSON.stringify(selected_step_ids.map((id) => {
            return GraphUtil.getNode(nodes, id);
        }));
    };

    /**
     * コピー可能なステップの判断（コマンド or サブフロー を1つのみ）
     * @returns {boolean}
     */
    const copyableStep = () => {
        const {selected_step_ids, nodes} = props;

        if (selected_step_ids.length as number !== 1) return false;

        if(selected_step_ids.length){
            const targetNode = GraphUtil.getNode(nodes, selected_step_ids[0]);
            if (targetNode instanceof SubFlowStepModel || targetNode instanceof CommandStepModel) {
                return true;
            }
        }
        return false;
    };

    const copySteps = () => {
        const copySteps = (step_ids: string[]) => {
            dispatch(copyStepsAction(step_ids));
        };
        if (!copyableStep()) {
            navigator.clipboard.writeText("");
            return;
        }

        const {selected_step_ids} = props;
        const copyData = getCopyNodes();
        navigator.clipboard.writeText(copyData).then(() => {
            copySteps(selected_step_ids);
        }, (err) => {
            alert("クリップボードが利用できません");
        });
    };

    const deleteSteps = () => {
        const {selected_step_ids, deleteSteps} = props;
        deleteSteps(selected_step_ids);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const {history, redo, undo} = props;
        const current = history.current;
        const max = history.nodes.length;

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
            dispatch(dragStartAction(x, y));
        };
        if (isOnClickPaper(e) && !e.shiftKey) {
            // 規定の要素からのカーソル座標値を求めるためには
            // https://qiita.com/yukiB/items/cc533fbbf3bb8372a924
            const target_rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - target_rect.left;
            const y = e.clientY - target_rect.top;

            selectSteps();
            dragStart(x, y);
            setCoords({
                x: x,
                y: y
            });
        }
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const {drag} = props;
        const dragging = (x: number, y: number) => {
            dispatch(draggingAction(x, y));
        };
        if(drag.hasOwnProperty('start')){
            const target_rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - target_rect.left;
            const y = e.clientY - target_rect.top;

            dragging(x, y);
        }
    };

    const onMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const {drag, addHistory} = props;
        const dragEnd = (x: number, y: number) => {
            dispatch(dragEndAction(x, y));
        };
        if(drag.hasOwnProperty('start')){
            if(drag.hasOwnProperty('end')){
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

    const {editor, children} = props;
    const width = editor.width;
    // onKeyDownには tabIndex が必要
    // ref:https://stackoverflow.com/questions/43503964/onkeydown-event-not-working-on-divs-in-react
    return <div tabIndex={0} onKeyDown={(e) => onKeyDown(e)}
                onMouseDown={(e) => onMouseDown(e)}
                onMouseMove={(e) => onMouseMove(e)}
                onMouseUp={(e) => onMouseUp(e)}
                className={style.paper_scroller}
                style={{width: width}}>
        {children}
    </div>;
};


export {PaperScroller};
