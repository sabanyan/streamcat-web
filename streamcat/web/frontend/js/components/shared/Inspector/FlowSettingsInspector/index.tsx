import React, {Fragment} from "react";
import {BaseInspector} from "Shared/Inspector";
import * as style from '../style.scss';
import {AddButton, Button} from "Shared/Input";
import {ModalUtil} from "Utils/index";
import { Constants } from "Constants/index";
import {CommandSelector} from "FlowEditorContainer/Command";
import { AllNodeType, Command, Flow, FlowCommand, InlineFlowCommand } from "Model/Library";
import { RunnablesType } from 'Types/index';

type Props = {
    runnables: RunnablesType;
    selectedNodes: AllNodeType[];
    // nodes: any[];
    zoom: number;
    addNode: (addNode:AllNodeType, srcNodes:AllNodeType[], dstNodes:AllNodeType[], zoom:number) => void;
    addDataSrcNode: (command:Command | FlowCommand | InlineFlowCommand) => void;
    addDataDstNode: (command:Command | FlowCommand | InlineFlowCommand, selectedNodeId:string) => void;
    selectNodes: (selectedNodes: AllNodeType[]) => void;
    flowData: Flow;
    flowUuid: string;
    updateFlow: (flowData:Flow, zoom:number) => void;
    addHistory: () => void;
    addFlowVariableHidden: boolean;
    commandSelectorHidden: boolean;
    baseInspectorDisabled: boolean;
};

/*
  フローエディタで表示中のフローのInspector
*/
export const FlowSettingsInspector = (props: Props) => {
    const {flowData} = props;

    const onBlurTitle = (e: React.SyntheticEvent<HTMLInputElement>) => {
        flowData.label = e.currentTarget.value;
        props.updateFlow(flowData, zoom);
    };

    const onClickAddFlowParam = () => {
        const {updateFlow} = props;
        const name = setNewParamName("new_param", 1);
        flowData.params.push({label:name, name:name, type:'string'});
        updateFlow(flowData, zoom);
    };

    const setNewParamName = (name: string, cnt: number): string => {
        const findResult = flowData.params.find(param => {
            return param.name === (name + cnt);
        });
        if (findResult) {
            return setNewParamName(name, cnt + 1);
        }
        return name + cnt;
    };

    const onDeleteParam = (index) => {
        const {updateFlow} = props;
        flowData.params = flowData.params.filter((param, paramIndex) => {
            return paramIndex !== index;
        });
        updateFlow(flowData, zoom);
    };

    const onDescriptionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const {updateFlow} = props;
        flowData.description = e.currentTarget.value;
        updateFlow(flowData, zoom);
    };

    const onParamChange = (e: React.SyntheticEvent<HTMLInputElement>, index: number) => {
        const {updateFlow} = props;
        flowData.params[index].name = e.currentTarget.value;
        flowData.params[index].label = e.currentTarget.value;
        updateFlow(flowData, zoom);
    };

    const onClickDeleteParam = (e: React.MouseEvent, index: number) => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                onDeleteParam(index);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: "削除する",
            danger: true,
            content: <div>
                選択されたフロー変数を削除しますか？
            </div>
        });
    };

    const { flowUuid, runnables, zoom, addNode, addDataDstNode, addDataSrcNode,
            selectNodes, selectedNodes, addHistory, addFlowVariableHidden,
            commandSelectorHidden, baseInspectorDisabled } = props;

    let inputParamsContainer, addFlowParams;

    const inputParams = flowData.params.map((param, index) => {
        return <div key={index} className={style.flow_param}>
            <div className={style.left}>
                <input  id={`param${index}`}
                        type={'text'}
                        value={param.name}
                        readOnly={baseInspectorDisabled}
                        className={'form-control'}
                        onChange={(e) => {onParamChange(e, index)}} />
            </div>
            <div className={style.right}>
                <Button danger={true} disabled={baseInspectorDisabled} onClick={e => onClickDeleteParam(e, index)}>削除</Button>
            </div>
        </div>;
    });

    if (inputParams && inputParams.length) {
        // Note: ConsoleのIssueを抑制するためラベル文字列とinputタグをlabelタグの中に配置する
        inputParamsContainer = <div key='params' className={"mt-8px"}>
            <label>
                フロー変数
                {inputParams}
            </label>
        </div>;
    } else if (baseInspectorDisabled) {
        inputParamsContainer = <div key='noParams0' className={"mt-8px"}>
            <label>フロー変数</label>
            <div className={"text-center"}>
                <div className={style.label}>
                フロー変数が設定されていません
                </div>
            </div>
        </div>;
    } else {
        inputParamsContainer = <div key='noParams1' className={"mt-8px"}>
            <label>フロー変数</label>
        </div>;
    }

    if (!addFlowVariableHidden) {
        addFlowParams = <AddButton onClick={() => onClickAddFlowParam()}>フロー変数を追加する</AddButton>;
    }

    return <BaseInspector key={flowUuid} label={flowData.label}
                          onBlurTitle={(e) => onBlurTitle(e)}
                          disabled={baseInspectorDisabled}>
        {/* Note: ConsoleのIssueを抑制するためid属性を設定する */}
        <textarea id='flowDesc'
                  defaultValue={flowData.description}
                  placeholder={"フローの説明"}
                  disabled={baseInspectorDisabled}
                  rows={8}
                  className={'form-control mb-8px'}
                  onChange={e => onDescriptionChange(e)} />
        {inputParamsContainer}
        {addFlowParams}
        {
            (!commandSelectorHidden) ?
                <Fragment>
                    <div className={style.full_hr} />
                    <CommandSelector
                        nodes={flowData.nodes}
                        runnables={runnables}
                        numberOfInput={0}
                        selectedNodes={selectedNodes}
                        zoom={zoom}
                        addNode={addNode}
                        addDataSrcNode={addDataSrcNode}
                        addDataDstNode={addDataDstNode}
                        selectNodes={selectNodes}
                        addHistory={addHistory}
                    />
                </Fragment>
            : null
        }
    </BaseInspector>;
};
