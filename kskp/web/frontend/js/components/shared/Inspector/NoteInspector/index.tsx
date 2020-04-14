import React from "react";
import {BaseInspector} from "Shared/Inspector";
import {GraphUtil, ModalUtil} from "Utils/index";
import {Button, DropDownList} from "Shared/Input";
import Constants from "Constants/index";
import style from "../style.scss";
import {NoteStepModel} from "Model/index";
import {FlowEditorProps} from "FlowEditorContainer/index";
import {dropDownListItem} from "Types/index";
import Spacer from "Shared/Base/Layouts/Spacer";

type State = {
  loading: boolean;
}

interface NoteInspectorProps extends FlowEditorProps  {
  selected_step_ids: string[];
  nodes: [];
  selectSteps: Function;
  updateStep: Function;
  deleteSteps: Function;
}

class NoteInspector extends React.Component<NoteInspectorProps, State> {

  constructor (props: NoteInspectorProps) {
    super(props)
  }

  getSelectedStep (): NoteStepModel {
      let {selected_step_ids, nodes} = this.props;
      if (Array.isArray(selected_step_ids) && selected_step_ids.length > 0) {
          return GraphUtil.getNode(nodes, selected_step_ids[0]);
      }
      return null;
  }

  onClickDelete () {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        let {selected_step_ids} = this.props;
        this.props.deleteSteps(selected_step_ids);
        this.props.selectSteps();
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    });
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

  update (getNewStep: Function) {
    let selectedStep = this.getSelectedStep();
    const newStep = getNewStep(selectedStep);
    this.props.updateStep(newStep)
  }

  onTitleChange (e: React.ChangeEvent<HTMLInputElement>) {
    this.update((step) => {
        if(e.target && e.target.value){
            step.title = e.target.value
        }
      return step
    })
  }

  onContentChange (e: React.ChangeEvent<HTMLTextAreaElement>) {
    this.update((step) => {
      step.content = e.target.value;
      return step
    })
  }

  onChangeFontSize (e: React.ChangeEvent<HTMLInputElement>, data, label) {
    console.log(e);
    console.log(data);
    console.log(label);
    this.update((step) => {
      step.fontSize = e.target.value;
      return step;
    })
  }

  onChangeColor (e: React.ChangeEvent<HTMLInputElement>, data, label) {
    console.log(e);
    console.log(data);
    console.log(label);
    this.update((step) => {
      step.color = e.target.value;
      return step;
    })
  }

  static getFontSizeList(){
    const maxFontSize = Constants.default.note.fontSize.max;
    const minFontSize = Constants.default.note.fontSize.min;
    const increase = Constants.default.note.fontSize.increase;
    const list:dropDownListItem[] = [];
      for (let i = minFontSize; i < maxFontSize; i = i + increase) {
          list.push({
              value: i,
              label: i + "px"
          });
      }
      return list;
  }

  static getColorList() {
      return [{
          value: Constants.default.note.color.green,
          label: "緑"
      }, {
          value: Constants.default.note.color.red,
          label: "赤"
      }, {
          value: Constants.default.note.color.yellow,
          label: "黄"
      }];
  }

  render () {
    let selected_step = this.getSelectedStep();
    const noteTitle = selected_step.title;
    const noteContent = selected_step.content;
    const fontSize = selected_step.fontSize;
    const color = selected_step.color;
    let content = <div className="property_body">
        <div>
            <input type="text"
                   className={"form-control mb-8px"}
                   placeholder={"メモのタイトル"}
                   defaultValue={noteTitle}
                   onChange={(e) => {
                       this.onTitleChange(e);
                   }}>
            </input>
            <Spacer height={6} />
            <textarea className={"mb-8px form-control"}
                      placeholder={"メモの詳細"}
                      defaultValue={noteContent}
                      rows={8}
                      onChange={(e) => {
                          this.onContentChange(e);
                      }} />
            <Spacer height={6} />
            <DropDownList disabled={false}
                          key={"fontSize"}
                          onChange={(e, data, label) => this.onChangeFontSize(e, data, label)}
                          defaultValue={fontSize}
                          list={NoteInspector.getFontSizeList()}
                          label={"文字"}
                          hiddenNoSelect={true}
            />
            <Spacer height={12} />
            <DropDownList disabled={false}
                          key={"color"}
                          onChange={(e, data, label) => this.onChangeColor(e, data, label)}
                          defaultValue={color}
                          list={NoteInspector.getColorList()}
                          label={"色"}
                          hiddenNoSelect={true}
            />
            <Spacer height={12} />
            <Button onClick={() => this.onClickDelete()} danger={true}>
                削除
            </Button>
        </div>
    </div>;

    return <BaseInspector header={''} label={selected_step.label} style={style}>
      {content}
    </BaseInspector>
  }
}

export default NoteInspector;
