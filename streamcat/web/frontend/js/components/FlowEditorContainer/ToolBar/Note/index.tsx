import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';
import Constants from 'Constants/index';
import { NoteStepModel } from 'Model/index';
import { FlowUtil, ModelUtil, PositionUtil, ZoomUtil } from 'Utils/index';
import { defaultGraphProps } from 'Utils/GraphUtil';
import { StepModelType } from 'Types/index';
import { NoteNodeType, calcSize } from 'Model/Step/NodeTypes';

type Props = {
    zoom: number;
    nodes: any[];
    addStep: (add_step:StepModelType, src_step_ids:string[], dst_step_ids:string[], zoom:number) => void;
    addHistory: Function;
    children: React.ReactNode;
    disabled: boolean;
};

export const Note = (props: Props) => {
    const {zoom, nodes, addStep, addHistory, children, disabled} = props;

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
        const note = {
            id: ModelUtil.getNewId('note'),
            label: '',
            type: 'note',
            position: notOverlapNodePosition,
            size: {width:200, height:40},
            error: {},
            invalid: {},
            title: '新しいメモ',
            content: '',
            fontSize: 16,
            color: 'green',
            // setTitle: (title:string) => {},
            // setFontSize: (fontSize:number) => {}
            setTitle: (title:string) => {
                note.title = title;
                note.size = calcSize(title, note.fontSize || 16);
            },
            setFontSize: (fontSize:number) => {
                note.fontSize = fontSize;
                note.size = calcSize(note.title, fontSize);
            },
        };

        addStep(note, [], [], zoom);
        addHistory();
    };

    return <ToolBarButton onClick={onClick}
                          disabled={disabled}
                          icon='comment'>{children}</ToolBarButton>;
};
