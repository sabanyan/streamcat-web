import React from 'react'
import type { CommentDetailType } from '../../../../types/index'
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
    commentDetail?:CommentDetailType;
    loading: boolean;
  }

class CommentInspector extends React.Component<FlowEditorProps,State> {

    loading:boolean = false

    constructor (props:FlowEditorProps) {
        super(props)
        this.state = {
            loading: false
        }
    }

    onHide() {
        this.saveNodes()
    }

    onBlurContent(e: Event) {
        const selectedStep = this.getSelectedStep()
        let newSelectedStep = StateUtil.deepCopy(selectedStep)
        newSelectedStep.content = e.target.value
        this.props.updateStep(newSelectedStep)
    }

    saveNodes(){
        let {nodes} = this.props
        return FlowUtil.saveNodes(inject_flow_uuid,nodes)
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

    render () {
        let selected_step = this.getSelectedStep()
        const text = selected_step.content
        let content = <div>
            <div><textarea className={'mb-8px'} placeholder={'新しいメモ'} 
                    className={'form-control'} ref={'description'} rows={8}
                    onBlur={(e) => this.onBlurContent(e)}
                    defaultValue={text}>
                </textarea>
            </div>
            <div className={style.full_hr}>
                <Button onClick={(e) => this.onClickDelete(e)} danger={true}>
                削除する
                </Button>
            </div>
        </div>

        return <BaseInspector header={""} label={selected_step.label} {...this.props}
                onHide={()=>this.onHide()} style={style}>{content}</BaseInspector>
    }
}

export default CommentInspector