import React, { useState } from 'react';
import * as style from './style.scss';
import { Constants } from 'Constants/index';
import { CommandIcon, ErrorIcon, FileIcon, InOutIcon, NoteIcon, Rect, SubFlowIcon, DataSrcIcon, DataDstIcon } from 'Shared/SVG';
import { AllNodeType } from 'Model/Library';
import { RunnablesType } from 'Types/index';
import { CommandNodeType, FlowNodeType, FrameNodeType, InlineFlowNodeType, NoteNodeType } from 'Model/Node/NodeTypes';

type Props = {
    node: AllNodeType;
    flowIn: boolean;
    flowOut: boolean;
    selected: boolean;
    runnables: RunnablesType;
    onMouseDown: (node:AllNodeType, e: React.MouseEvent<SVGElement>) => void;
};

export const Node = (props: Props) => {
    const { node, selected } = props;

    const [hover, setHover] = useState<boolean>(false);

    /**
     * mouse over ホバー処理
     * @param e
     */
    const handleMouseOver = () => {
        //SVGに影をつける
        setHover(true);
    };

    /**
     * mouse leave ホバー終了処理
     * @param e
     */
    const handleMouseLeave = () => {
        //SVGの影をクリア
        setHover(false);
    };

    const isCommandNode = (node): boolean => {
        // return (step instanceof CommandStepModel);
        return node.type === 'command';
    };

    const isDataFrame = (node): boolean => {
        return node.type === 'frame';
    };

    const isSubFlow = (node): boolean => {
        return node.type === 'flow';
    };

    const isNote = (node): boolean => {
        // return (step instanceof NoteStepModel);
        return node.type === 'note';
    };

    const getFilter = () => {
        const filter = 'url(#default-shadow)';
        return filter;
    };

    const { flowIn, flowOut, runnables, onMouseDown } = props;
    const { x, y } = node.position;
    let icon: JSX.Element | null;

    /**
     * Nodeの種類に応じた見た目の設定
     */

    const filter = getFilter();

    let nodeLabel = node.label;

    if (isDataFrame(node)) {
        const frameNode = node as FrameNodeType;
        // データノード
        let innerIcon: JSX.Element;
        if (flowIn || flowOut) {
            // IN、OUT指定がある場合
            innerIcon = <InOutIcon flowIn={flowIn}
                                   flowOut={flowOut}
                                   width={50}
                                   height={50}
                                   stroke={'#CCCCCC'}
                                   fill={'#CCCCCC'} />;
        } else {
            // IN、OUT指定のない場合
            innerIcon = <FileIcon fillColor={(frameNode.hasData()) ? '#63CFFD' : '#CCCCCC'}
                                  width={16}
                                  height={20} />;
        }

        icon = <Rect selectedOutlineColor={'#93DFFF'} fillColor={'#FFFFFF'}
                     hoverFillColor={'#E8F8FF'} selectedFillColor={'#E8F8FF'}
                     hover={hover} selected={selected} stroke={'#63CFFD'}
                     filter={filter} style={RectStyle}>
            {innerIcon}
        </Rect>;
    } else if (isSubFlow(node)) {
        const flowNode = node as FlowNodeType | InlineFlowNodeType;
        if (flowNode.hasOwnProperty('flow') && flowNode.classification === 'data_source') {
            icon = <DataSrcIcon hover={hover} selected={selected} filter={filter} style={{ ...RectStyle, rx: 12, ry: 12 }} />
        } else if (flowNode.hasOwnProperty('flow') && flowNode.classification === 'data_dest') {
            icon = <DataDstIcon hover={hover} selected={selected} filter={filter} style={{ ...RectStyle, rx: 12, ry: 12 }} />
        } else {
            // サブフローノード
            icon = <SubFlowIcon hover={hover} selected={selected} filter={filter} />;
            nodeLabel = flowNode.label;
        }
    } else if (isCommandNode(node)) {
        const commandNode = node as CommandNodeType;
        // コマンドノード
        let command;
        if (runnables.commands) {
            runnables.commands.forEach(c => {
                if (c.id === commandNode.commandId) command = c;
            });
            icon = <CommandIcon command={command} hover={hover} selected={selected} filter={filter} />;
        } else {
            icon = null;
        }
        nodeLabel = commandNode.label;
    } else if (isNote(node)) {
        const noteNode = node as NoteNodeType;
        icon = <NoteIcon hover={hover} selected={selected} model={noteNode} />;
        nodeLabel = noteNode.label;
    } else {
        icon = null;
    }


    const invalid_icon = (node.invalid && Object.keys(node.invalid).length) ? <ErrorIcon /> : null;
    const error_icon = (node.error && Object.keys(node.error).length) ? <ErrorIcon /> : null;
    const label_text = (!!nodeLabel) ? 
                        <g className={style.labelContainer}>
                            <foreignObject {...NodeTextStyle} transform={'translate(' + (-1 * NodeTextStyle.width) + ',0)'}>
                                <div style={{
                                    display: 'table',
                                    width: '100%',
                                    height: NodeTextStyle.height,
                                    paddingRight: NodeTextStyle.padding + 'px'
                                }}>
                                    <p style={{
                                        display: 'table-cell',
                                        verticalAlign: 'middle',
                                        textAlign: 'right',
                                        wordBreak: 'break-all'
                                    }}>{nodeLabel}</p>
                                </div>
                            </foreignObject>
                        </g>
                        : null;

    return (
        <g transform={'translate(' + x + ',' + y + ')'}>
            <g onMouseDown={e => onMouseDown(node, e)}
                onMouseOver={() => handleMouseOver()}
                onMouseLeave={() => handleMouseLeave()}>
                {icon}
            </g>
            {invalid_icon}
            {error_icon}
            {label_text}
        </g>
    );
};

export const RectStyle = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    width: Constants.default.datasource.width,
    height: Constants.default.datasource.height,
    rx: 0,
    ry: 0,
    strokeWidth: 2
};

export const CircleStyle = {
    cx: Constants.default.operator.cx,
    cy: Constants.default.operator.cy,
    tx: 0,
    ty: 0,
    fill: '#ffffff',
    stroke: '#FC9E28',
    r: Constants.default.operator.r,
    strokeWidth: 2
};

export const NodeTextStyle = {
    width: 80,
    height: 50,
    fontSize: 10,
    padding: 8
};
