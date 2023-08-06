import React, {useEffect} from 'react';
import {BaseInspector} from 'Shared/Inspector';
import {GraphUtil, ModalUtil} from 'Utils/index';
import {Button, DropDownList} from 'Shared/Input';
import Constants from 'Constants/index';
import {NoteStepModel} from 'Model/index';
import {dropDownListItem} from 'Types/index';
import {Spacer} from 'Shared/Base';
import { NoteNodeType } from 'Model/Step/NodeTypes';
import { AllNodeType, Flow } from 'Model/Library';

interface Props {
    selectedStepIds: string[];
    nodes: AllNodeType[];
    selectSteps: (selected_steps: any[]) => void;
    updateStep: (node:NoteNodeType) => void;
    deleteSteps: (step_ids: string[]) => void;
    baseInspectorDisabled: boolean;
    addHistory: Function;
}

const NoteInspector = (props: Props) => {
    useEffect(() => {
        const element: HTMLInputElement = document.querySelector('.property_body input:first-child') as HTMLInputElement;
        if (element) element.focus();
    }, []);

    const getSelectedStep = () => {
        const {selectedStepIds, nodes} = props;
        if (Array.isArray(selectedStepIds) && selectedStepIds.length > 0) {
            return GraphUtil.getNode(nodes, selectedStepIds[0]) as NoteNodeType;
        }
        return null;
    };

    const onClickDelete = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM,
            onClickDone: () => {
                const {selectedStepIds, deleteSteps, selectSteps, addHistory} = props;
                deleteSteps(selectedStepIds);
                selectSteps([]);
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
                選択されたステップを削除しますか？
            </div>
        });
    };

    const update = (getNewStep:(step:NoteNodeType) => NoteNodeType) => {
        const {updateStep} = props;
        const selectedStep = getSelectedStep();
        if(selectedStep){
            const newStep = getNewStep(selectedStep);
            updateStep(newStep);
        }
    };

    const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        update((step) => {
            if (e.target) {
                step.setTitle(e.target.value);
            }
            return step;
        });
    };

    const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        update((step) => {
            step.content = e.target.value;
            return step;
        });
    };

    const onChangeFontSize = (e: React.ChangeEvent<HTMLInputElement>, data, label) => {
        update((step) => {
            const fontSize = parseInt(e.target.value);
            step.setFontSize(fontSize);
            return step;
        });
    };

    const onChangeColor = (e: React.ChangeEvent<HTMLInputElement>, data, label) => {
        update((step) => {
            step.color = e.target.value;
            return step;
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

    const selected_step = getSelectedStep();
    if (!selected_step) return null;
    const noteTitle = selected_step.title;
    const noteContent = selected_step.content;
    const fontSize = selected_step.fontSize;
    const color = selected_step.color;
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
                defaultValue={fontSize?.toString() || '16'}
                disabled={baseInspectorDisabled}
                list={getFontSizeList()}
                label={'文字'}
                hiddenNoSelect={true}
            />
            <Spacer height={12} />
            <DropDownList
                key='color'
                onChange={(e, data, label) => onChangeColor(e, data, label)}
                defaultValue={color || Constants.default.note.color.green}
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

    return <BaseInspector key={selected_step.id} header={''} label={null} disabled={baseInspectorDisabled} >
        {content}
    </BaseInspector>;
};

export {NoteInspector};
