import React from 'react';
import { StateUtil, ModalUtil, FlowUtil } from 'Utils/index';
import { BaseInspector, ParamsForm, InOutConnector } from 'Shared/Inspector'
import { Button } from 'Shared/Input'
import { Loader } from 'Shared/Base'
import Constants from 'Constants/index'

import style from '../style.scss'
import { AllNodeType } from 'Model/Library';
import { RunnablesType } from 'Types/index';


type State = {
  isLoading: boolean
}

type Props = {
  nodes: AllNodeType[];

  selectedNodeId: string;
  baseInspectorDisabled: boolean;

  runnables: RunnablesType;
  parentUUID?: string;

  updateNode: (node: AllNodeType) => void;
  // updateNodeEdges: (node: AllNodeType) => void;
  addHistory: () => void;
  selectNodes: (selectedNodes: AllNodeType[]) => void;
  deleteNodes: (nodeIds: string[]) => void;
}


// データソースNodeのペイン
export class DataDstInspector extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      isLoading: false
    }
  }

  getSelectedNode(): any {
    let { selectedNodeId, nodes } = this.props
    return FlowUtil.getNode(nodes, selectedNodeId)
  }

  renderActions() {
    const { baseInspectorDisabled } = this.props;

    return <React.Fragment>
      <Button onClick={(e) => this.onClickDelete(e)} icon={'delete'}
        danger={true} disabled={baseInspectorDisabled}>削除</Button>
    </React.Fragment>
  }

  onClickDelete(e: any) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        let { selectedNodeId, nodes } = this.props
        const selectedNode = FlowUtil.getNode(nodes, selectedNodeId)
        this.props.deleteNodes([selectedNode.id])
        this.props.selectNodes([])
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
        選択されたデータデスト削除しますか？
      </div>,
    })
  }

  renderContents() {
    const { updateNode, nodes, runnables, baseInspectorDisabled, parentUUID } = this.props;
    const selectedNode = this.getSelectedNode();

    let libraryPlace: any = null;
    let inOutConnector: any = null;
    let paramsForm: any = null;

    if (selectedNode.srcs || selectedNode.dsts) {
      inOutConnector = <InOutConnector
        selectedNode={selectedNode}
        updateNode={updateNode}
        // updateNodeEdges={updateNodeEdges}
        nodes={nodes}
        runnables={runnables}
        disabled={baseInspectorDisabled}
      />;
    }

    if (selectedNode.flow.params) {
      paramsForm = <ParamsForm params={selectedNode.flow.params} args={selectedNode.args} invalids={{}} parentUUID={parentUUID}
        onChange={(e, param, value) => this.onArgChange(e, param, value)} />;
    }

    return <React.Fragment>
      <div><label>場所</label></div>
      <div>
        <a href={'/folders/' + selectedNode.folderUuid} target={'_blank'}>{selectedNode.folderPath}</a>
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
    this.update(node => {
      if (node.args) {
        node.args[param.name] = value
        if (!value) delete node.args[param.name]
      }
      return node
    })
  }

  update(getNewNode: Function) {
    const selectedNode = this.getSelectedNode()
    const newNode = getNewNode(selectedNode)
    this.props.updateNode(newNode)
  }

  render() {
    const { baseInspectorDisabled } = this.props;
    const selectedNode = this.getSelectedNode();

    if (this.state.isLoading) return <Loader center={true} absolute={true} fixed={false} visible={true} />

    return <BaseInspector key={selectedNode.uuid} header={''} label={selectedNode.label}
      onBlurTitle={(e) => this.onBlurTitle(e)} onHide={() => { }} disabled={baseInspectorDisabled}>
      <div className={style.property_overview}>
        <div className={style.actions}>
          {this.renderActions()}
        </div>
        <div className={style.full_hr} />
        <div className={style.overviews}>
          {(selectedNode.flow.params) ? this.renderContents() : null}
        </div>
      </div>
    </BaseInspector >
  }

  onBlurTitle(e: any) {
    const selectedNode = this.getSelectedNode()
    selectedNode.label = e.target.value
    this.props.updateNode(selectedNode)
  }
}
