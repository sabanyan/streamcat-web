import React from 'react';
import {useAsyncResource} from 'use-async-resource';
import {BaseInspector, InOutConnector, ParamsForm} from "Shared/Inspector";
import style from "../style.scss";
import {Button} from "Shared/Input";
import { Constants } from "Constants/index";
import {ModalUtil} from "Utils/index";
import { Api } from 'Api';
import { AllNodeType } from 'Model/Library';
import { CommandNodeType, FlowNodeType } from 'Model/Node/NodeTypes';
import { RunnablesType } from 'Types/index';

type Props = {
    selectedNode: AllNodeType;
    // runnables: RunnablesType;
    nodes: AllNodeType[];
    runnables: RunnablesType;
    updateNode: (node: AllNodeType) => void;
    // updateNodeEdges: (node:AllNodeType) => void;
    addHistory: () => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    deleteNodes: (nodes: AllNodeType[]) => void;
    // children?: React.ReactNode;
    baseInspectorDisabled: boolean;
};

const getFlow = (uuid: string) => {
    if(uuid){
        return Api.findFlow(uuid);
    }else{
        // uuidが指定されない場合はAPIを発行しない
        return Api.findNull();
    }
};

export const CommandInspector = (props: Props) => {

    // 選択中のNodeを取得する
    const runableNode = props.selectedNode as CommandNodeType|FlowNodeType;

    // ここでFlowの取得を開始する
    const [flowReader] = useAsyncResource(getFlow, (runableNode as any).uuid);

    const onHide = () => {
        //this.props.addHistory()
    };

    const deleteNode = () => {
        const {deleteNodes, selectNodes, addHistory} = props;
        deleteNodes([runableNode]);
        selectNodes([]);
        addHistory()
    };

    const onClickDelete = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                deleteNode();
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "削除する",
            danger: true,
            content: <div>
                選択されたノードを削除しますか？
            </div>
        });
    };

    const onClickOpenSubFlow = (e, flowUUID: any) => {
        window.location.href = '/flows/' + flowUUID;
    }

    const onChangeInEdge = (e, data) => {
        console.log(e);
        console.log(data);
    };

    const onChangeOutEdge = (e, data) => {
        console.log(e);
        console.log(data);
    };


    const onArgChange = (e, param, value) => {
        update(node => {
            if (node.args) {
                node.args[param.name] = value;
                if (!value) delete node.args[param.name];
            }
            return node;
        });
    };

    const {updateNode, baseInspectorDisabled, nodes, runnables} = props;

    const update = (getNewNode: Function) => {
        const newNode = getNewNode(runableNode);
        updateNode(newNode);
    };

    const onBlurTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        runableNode.label = e.target.value;
        updateNode(runableNode);
    };

    let inputForm: React.ReactNode = [];
    let subFlowLink, label, subLabel, detail;
    if (runableNode.type === Constants.node.type.command) {
        const commandNode = runableNode as CommandNodeType;
        //指定されたNodeの元コマンドを取得
        const command = runnables.commands.getCommand(commandNode.commandId);
        //選択されたNodeのラベルを取得
        label = commandNode.label;
        //コマンドのラベルを取得
        subLabel = `${command?.label || ''} - ${commandNode.commandId || ''}`;
        const params = command?.params || [];
        const args = commandNode.args;
        const invalids = commandNode.invalid;

        inputForm = <ParamsForm disabled={baseInspectorDisabled} params={params} args={args} invalids={invalids} command={command || undefined}
                                onChange={(e, param, value) => onArgChange(e, param, value)} groups={command?.groups || []} />;

    } else if (runableNode.type === Constants.node.type.subflow) {
        if (runableNode.hasOwnProperty('uuid')) {
            const flowNode = runableNode as FlowNodeType;
            const subflowCommand = runnables.subflows.getCommand(flowNode.uuid);
            label = flowNode?.label || '';
            subLabel = subflowCommand?.label || '';
            const params = subflowCommand?.params || [];
            const args = flowNode.args;
            const invalids = flowNode.invalid;

            inputForm = <ParamsForm disabled={baseInspectorDisabled} params={params} args={args} invalids={invalids}
                                    onChange={(e, param, value) => onArgChange(e, param, value)}/>;
            subFlowLink = <Button onClick={(e) => onClickOpenSubFlow(e, flowNode.uuid)}>フローを開く</Button>;

            // サブフローがライブラリに存在する場合(リテラルでない場合)はそのサブフローの格納フォルダへのリンクを表示する
            const flow = flowReader();
            if(flow){
                detail = <div>
                    <a href={'/folders/' + flow.folderUuid} target={'_blank'}>{flow.folderPath}</a>
                </div>
            }
        }
    }

    let form;

    if (inputForm) {
        form = <div>
            <div className={style.full_hr} />
            <div>
                <div className="streamcat-form">
                    {inputForm}
                </div>
            </div>
        </div>;
    }

    const content = <div>
        <div className={style.actions}>
            {subFlowLink}
            <Button onClick={() => onClickDelete()} danger={true} icon={'delete'} disabled={baseInspectorDisabled}>削除</Button>
        </div>
        <div className={style.full_hr} />
        <div><label>場所</label></div>
        {detail}
        <InOutConnector
            updateNode={updateNode}
            // updateNodeEdges={updateNodeEdges}
            nodes={nodes}
            runnables={runnables}
            selectedNode={runableNode}
            disabled={baseInspectorDisabled}
        />
        {form}
    </div>;

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector key={runableNode.id} label={label} subLabel={subLabel}
                          onHide={onHide}
                          onBlurTitle={(e) => onBlurTitle(e)}
                          disabled={baseInspectorDisabled}>
        {content}
    </BaseInspector>;

};
