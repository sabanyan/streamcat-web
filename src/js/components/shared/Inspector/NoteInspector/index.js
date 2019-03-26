import React from 'react'
import type { NoteDetailType } from '../../../../types/index'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import BaseInspector from '../BaseInspector/index'
import Graph from '../../../../utils/Graph'
import Button from '../../Button/index'
import ModalUtil from '../../../../utils/ModalUtil'
import Constants from '../../../../constants/index'
import FlowUtil from '../../../../utils/FlowUtil'
import StateUtil from '../../../../utils/State'
import style from '../style.scss'

type State = {
    noteDetail?:NoteDetailType;
    loading: boolean;
    title: ref;
    content: ref;
  }

class NoteInspector extends React.Component<FlowEditorProps,State> {

    constructor (props:FlowEditorProps) {
        super(props)
    }

    getSelectedStep():StepModelType {
        let {selected_step_ids, nodes} = this.props
        return Graph.getNode(nodes,selected_step_ids[0])
    }

    onClickDelete(e: Event) {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
              let {selected_step_ids} = this.props
              this.props.deleteSteps(selected_step_ids)
              this.props.selectSteps()
              ModalUtil.closeModal(Constants.modal.CONFIRM)
            },
          })
          ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: '削除する',
            danger: true,
            content: <div>
              選択されたステップを削除しますか？
            </div>,
          })
    }

    update (getNewStep:Function) {
        let selectedStep = this.getSelectedStep()
        const newStep = getNewStep(selectedStep)
        this.props.updateStep(newStep)
    }

    onTitleChange(e: Event) {
        this.update((step) => {
            step.title = e.target.value
            return step
        })
    }

    onContentChange(e: Event) {
        this.update((step) => {
            step.content = e.target.value
            return step
        })
    }
    
    render () {
        let selected_step = this.getSelectedStep()
        const noteTitle = selected_step.title
        const noteContent = selected_step.content
        let content = <div className="property_body">
            <div>
                <input type="text" className={'mb-8px'} placeholder={'新しいメモのタイトル'} 
                    className={'form-control'} rows={8}
                    defaultValue={noteTitle} onChange={(e) => {this.onTitleChange(e)}}>
                </input>
                <hr className={style.full_hr}></hr>
                <textarea className={'mb-8px'} placeholder={'フローの説明'} className={'form-control'}
                defaultValue={noteContent} rows={8} onChange={(e) => {this.onContentChange(e)}}></textarea>
                <hr className={style.full_hr}></hr>
                <Button onClick={(e) => this.onClickDelete(e)} danger={true}>
                削除
                </Button>
            </div>
        </div>

        return <BaseInspector header={""} label={selected_step.label} {...this.props} style={style}>
            {content}
        </BaseInspector>
    }
}

export default NoteInspector