import React, {useEffect} from 'react';
import {BaseInspector} from 'Shared/Inspector';
import {GraphUtil, ModalUtil} from 'Utils/index';
import {Button, DropDownList} from 'Shared/Input';
import Constants from 'Constants/index';
import {dropDownListItem} from 'Types/index';
import {Spacer} from 'Shared/Base';
import { NoteNodeType } from 'Model/Node/NodeTypes';
import { AllNodeType } from 'Model/Library';

interface Props {
    selectedNodeId: string;
    nodes: AllNodeType[];
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    updateNode: (node:NoteNodeType) => void;
    deleteNodes: (nodeIds: string[]) => void;
    baseInspectorDisabled: boolean;
    addHistory: () => void;
}

const NoteInspector = (props: Props) => {
    useEffect(() => {
        const element: HTMLInputElement = document.querySelector('.property_body input:first-child') as HTMLInputElement;
        if (element) element.focus();
    }, []);

    const getSelectedNode = () => {
        const {selectedNodeId, nodes} = props;
        return GraphUtil.getNode(nodes, selectedNodeId) as NoteNodeType;
    };

    const onClickDelete = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM,
            onClickDone: () => {
                const {selectedNodeId, deleteNodes, selectNodes, addHistory} = props;
                deleteNodes([selectedNodeId]);
                selectNodes([]);
                addHistory();
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: '削除する',
            danger: true,
            content: <div>
                選択されたノードを削除しますか？
            </div>
        });
    };

    const update = (getNewNode:(node:NoteNodeType) => NoteNodeType) => {
        const {updateNode: updateNode} = props;
        const selectedNode = getSelectedNode();
        if(selectedNode){
            const newNote = getNewNode(selectedNode);
            updateNode(newNote);
        }
    };

    const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        update(node => {
            if (e.target) {
                node.setTitle(e.target.value);
            }
            return node;
        });
    };

    const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        update(node => {
            node.content = e.target.value;
            return node;
        });
    };

    const onChangeFontSize = (e: React.ChangeEvent<HTMLInputElement>, data, label) => {
        update(node => {
            const fontSize = parseInt(e.target.value);
            node.setFontSize(fontSize);
            return node;
        });
    };

    const onChangeColor = (e: React.ChangeEvent<HTMLInputElement>, data, label) => {
        update(node => {
            node.color = e.target.value;
            return node;
        });
    };

    const getFontSizeList = () => {
        const maxFontSize = Constants.default.note.fontSize.max;
        const minFontSize = Constants.default.note.fontSize.min;
        const increase = Constants.default.note.fontSize.increase;
        const list: dropDownListItem[] = [];
        for (let i = minFontSize; i < maxFontSize; i = i + increase) {
            list.push({
                value: i.toString(),
                label: i + 'px'
            });
        }
        return list;
    };

    const getColorList = () => {
        return [{
            value: Constants.default.note.color.green,
            label: '緑'
        }, {
            value: Constants.default.note.color.red,
            label: '赤'
        }, {
            value: Constants.default.note.color.yellow,
            label: '黄'
        }];
    };

    const {baseInspectorDisabled} = props;

    const selectedNode = getSelectedNode();
    if (!selectedNode) return null;
    const noteTitle = selectedNode.title;
    const noteContent = selectedNode.content;
    const fontSize = selectedNode.fontSize;
    const color = selectedNode.color;
    const content = <div className='property_body'>
        <div>
            <input
                type='text'
                className={'form-control mb-8px'}
                placeholder={'メモのタイトル'}
                defaultValue={noteTitle}
                disabled={baseInspectorDisabled}
                onChange={(e) => {
                    onTitleChange(e);
                }}>
            </input>
            <Spacer height={6} />
            <textarea
                className={'mb-8px form-control'}
                placeholder={'メモの詳細'}
                defaultValue={noteContent}
                disabled={baseInspectorDisabled}
                rows={8}
                onChange={(e) => {
                    onContentChange(e);
                }} />
            <Spacer height={6} />
            <DropDownList
                key='fontSize'
                onChange={(e, data, label) => onChangeFontSize(e, data, label)}
                value={fontSize?.toString() || '16'}
                disabled={baseInspectorDisabled}
                list={getFontSizeList()}
                label={'文字'}
                hiddenNoSelect={true}
            />
            <Spacer height={12} />
            <DropDownList
                key='color'
                onChange={(e, data, label) => onChangeColor(e, data, label)}
                value={color || Constants.default.note.color.green}
                disabled={baseInspectorDisabled}
                list={getColorList()}
                label={'色'}
                hiddenNoSelect={true}
            />
            <Spacer height={12} />
            <Button onClick={() => onClickDelete()} danger={true} disabled={baseInspectorDisabled}>
                削除
            </Button>
        </div>
    </div>;

    return <BaseInspector key={selectedNode.id} header={''} label={null} disabled={baseInspectorDisabled} >
        {content}
    </BaseInspector>;
};

export {NoteInspector};
