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

  selectedNode: AllNodeType;
  baseInspectorDisabled: boolean;

  runnables: RunnablesType;
  parentUUID?: string;

  updateNode: (node: AllNodeType) => void;
  // updateNodeEdges: (node: AllNodeType) => void;
  addHistory: () => void;
  selectNodes: (selectedNodes: AllNodeType[]) => void;
  deleteNodes: (nodes: AllNodeType[]) => void;
}


// データソースNodeのペイン
export class DataDstInspector extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      isLoading: false
    }
  }

  // getSelectedNode(): any {
  //   let { selectedNodeId, nodes } = this.props
  //   return FlowUtil.getNode(nodes, selectedNodeId)
  // }

  renderActions() {
    const { baseInspectorDisabled } = this.props;

    return <React.Fragment>
      <Button onClick={(e) => this.onClickDelete(e)} icon={'delete'}
        danger={true} disabled={baseInspectorDisabled}>削除</Button>
    </React.Fragment>
  }

  onClickDelete(e: any) {
    const dstNode = this.props.selectedNode;
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        this.props.deleteNodes([dstNode])
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
    const dstNode = this.props.selectedNode as any;

    let libraryPlace: any = null;
    let inOutConnector: any = null;
    let paramsForm: any = null;

    if (dstNode.srcs || dstNode.dsts) {
      inOutConnector = <InOutConnector
        selectedNode={dstNode}
        updateNode={updateNode}
        // updateNodeEdges={updateNodeEdges}
        nodes={nodes}
        runnables={runnables}
        disabled={baseInspectorDisabled}
      />;
    }

    if (dstNode.flow.params) {
      paramsForm = <ParamsForm params={dstNode.flow.params} args={dstNode.args} invalids={{}} parentUUID={parentUUID}
        onChange={(e, param, value) => this.onArgChange(e, param, value)} />;
    }

    return <React.Fragment>
      <div><label>場所</label></div>
      <div>
        <a href={'/folders/' + dstNode.folderUuid} target={'_blank'}>{dstNode.folderPath}</a>
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
    const dstNode = this.props.selectedNode;
    const newNode = getNewNode(dstNode)
    this.props.updateNode(newNode)
  }

  render() {
    const { baseInspectorDisabled } = this.props;
    const dstNode = this.props.selectedNode as any;

    if (this.state.isLoading) return <Loader center={true} absolute={true} fixed={false} visible={true} />

    return <BaseInspector key={dstNode.uuid} header={''} label={dstNode.label}
      onBlurTitle={(e) => this.onBlurTitle(e)} onHide={() => { }} disabled={baseInspectorDisabled}>
      <div className={style.property_overview}>
        <div className={style.actions}>
          {this.renderActions()}
        </div>
        <div className={style.full_hr} />
        <div className={style.overviews}>
          {(dstNode.flow.params) ? this.renderContents() : null}
        </div>
      </div>
    </BaseInspector >
  }

  onBlurTitle(e: any) {
    const dstNode = this.props.selectedNode;
    dstNode.label = e.target.value
    this.props.updateNode(dstNode)
  }
}
