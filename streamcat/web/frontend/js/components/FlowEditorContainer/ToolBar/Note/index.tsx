import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';
import Constants from 'Constants/index';
import { FlowUtil, ModelUtil, PositionUtil, ZoomUtil } from 'Utils/index';
import { defaultGraphProps } from 'Utils/GraphUtil';
import { NoteNode, NoteNodeType } from 'Model/Node/NodeTypes';
import { AllNodeType } from 'Model/Library';

type Props = {
    zoom: number;
    nodes: AllNodeType[];
    addNote: (addNode:AllNodeType, srcNodes:AllNodeType[], dstNodes:AllNodeType[], zoom:number) => void;
    addHistory: () => void;
    children: React.ReactNode;
    disabled: boolean;
};

export const Note = (props: Props) => {
    const {zoom, nodes, addNote, addHistory, children, disabled} = props;

    const onClick = () => {
        let position = PositionUtil.getCenterPosition('#flow_editor>div');
        position = {
            x: ZoomUtil.zoomReverse(position.x, zoom),
            y: ZoomUtil.zoomReverse(position.y, zoom)
                + Constants.default.step.height
                + defaultGraphProps.rankSeparator
        };

        const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition(
            { ...position },
            nodes
        );

        // const note = new NoteStepModel({
        //     id: '',
        //     type: Constants.step.type.note,
        //     position: notOverlapNodePosition,
        //     title: '新しいメモ',
        //     content: ''
        // });
        const newId = ModelUtil.getNewId(nodes, 'note');
        const note = new NoteNode(newId, notOverlapNodePosition) as NoteNodeType;

        addNote(note, [], [], zoom);
        addHistory();
    };

    return <ToolBarButton onClick={onClick}
                          disabled={disabled}
                          icon='comment'>{children}</ToolBarButton>;
};
