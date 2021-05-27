import React, { Fragment } from 'react';

import { flowEditorReducerInitialState } from 'Modules/flowEditor';
import { GraphUtil, StateUtil, ModalUtil, HttpUtil } from 'Utils/index';
import { BaseInspector, ParamsForm, InOutConnector } from 'Shared/Inspector'
import { Button } from 'Shared/Input'
import { Loader } from 'Shared/Base'
import Constants from 'Constants/index'

import style from '../style.scss'


type State = {
  isLoading: boolean
}

type Props = {
  nodes: [];

  selected_step_ids: string[];
  baseInspectorDisabled: boolean;

  sortStepSrcEnd: Function;
  updateStep: Function;
  addHistory: Function;
  selectSteps: Function;
  deleteSteps: Function;
}


// データソースステップのペイン
export default class DataSrcInspector extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      isLoading: false
    }
  }

  componentWillMount() {
  }

  getSelectedStep(): any {
    let { selected_step_ids, nodes } = this.props
    return GraphUtil.getNode(nodes, selected_step_ids[0])
  }

  renderActions() {
    const { baseInspectorDisabled } = this.props;
    let result = [];

    return <React.Fragment>
      <Button onClick={(e) => this.onClickDelete(e)} icon={'delete'}
        danger={true} disabled={baseInspectorDisabled}>削除</Button>
    </React.Fragment>
  }

  onClickDelete(e: any) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        let { selected_step_ids, nodes } = this.props
        const selected_step = GraphUtil.getNode(nodes, selected_step_ids[0])
        this.props.deleteSteps([selected_step.id])
        this.props.selectSteps()
        this.props.addHistory()
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたデータソースを削除しますか？
      </div>,
    })
  }

  renderContents() {
    const { updateStep, nodes, sortStepSrcEnd, baseInspectorDisabled } = this.props;
    const selected_step = this.getSelectedStep();

    let libraryPlace: any = null;
    let inOutConnector: any = null;
    let paramsForm: any = null;

    if (selected_step.srcs || selected_step.dsts) {
      inOutConnector = <InOutConnector
        selectedStep={selected_step}
        updateStep={updateStep}
        nodes={nodes}
        sortStepSrcEnd={sortStepSrcEnd}
        onChangeInEdge={(e, data) => this.onChangeInEdge(e, data)}
        onChangeOutEdge={(e, data) => this.onChangeOutEdge(e, data)}
        disabled={baseInspectorDisabled}
      />
    }

 
    if (selected_step.flow.params) {
      
      paramsForm = <ParamsForm params={selected_step.flow.params} args={selected_step.args} invalids={{}}
        onChange={(e, param, value) => this.onArgChange(e, param, value)} />;
    }

    return <React.Fragment>
      <div><label>場所</label></div>
      <div>
        <a href={'/folders/' + selected_step.folderUuid} target={'_blank'}>{selected_step.folderPath}</a>
      </div>
      {libraryPlace}
      {inOutConnector}
      <div className={style.full_hr} />
      <div>{paramsForm}</div>

    </React.Fragment>
  }

  onChangeInEdge(e, data) {
    console.log(e)
    console.log(data)
  }

  onChangeOutEdge(e, data) {
    console.log(e)
    console.log(data)
  }

  onArgChange(e, param, value) {
    this.update((step) => {
      if (step.args) {
        step.args[param.name] = value
        if (!value) delete step.args[param.name]
      }
      return step
    })
  }

  onClickPlace(parentFolderUUID: string = "") {
    window.open("/folders/" + parentFolderUUID, "_blank");
  }
  /*
  onClickPlace() {
    HttpUtil.windowOpen("library?dialog=true&mode=frame_select", (args) => {
      const selected_data: any = args;
      //ステップの選択をキャンセル
      this.props.addHistory();
    });
  }
  */

  update(getNewStep: Function) {
    let selectedStep = this.getSelectedStep()
    const newStep = getNewStep(selectedStep)
    this.props.updateStep(newStep)
  }

  render() {
    const { selected_step_ids, addHistory, selectSteps, deleteSteps, baseInspectorDisabled } = this.props;
    const selected_step = this.getSelectedStep();

    if (this.state.isLoading) return <Loader center={true} absolute={true} fixed={false} visible={true} />

    return <BaseInspector key={selected_step.uuid} header={''} label={selected_step.label}
      onBlurTitle={(e) => this.onBlurTitle(e)} onHide={() => { }} disabled={baseInspectorDisabled}>
      <div className={style.property_overview}>
        <div className={style.actions}>
          {this.renderActions()}
        </div>
        <div className={style.full_hr} />
        <div className={style.overviews}>
          {(selected_step.flow.params) ? this.renderContents() : null}
        </div>
      </div>
    </BaseInspector >
  }

  onBlurTitle(e: any) {
    const selectedStep = this.getSelectedStep()
    let newSelectedStep = StateUtil.deepCopy(selectedStep)
    newSelectedStep.label = e.target.value
    this.props.updateStep(newSelectedStep)
  }
}


