import React from 'react';
import style from '../style.scss';
import Constants from 'Constants/index';
import {DropDownList} from 'Shared/Input';
import {FlowUtil, ModalUtil, StateUtil} from 'Utils/index';
import { CommandNodeType, FrameNodeType } from 'Model/Step/NodeTypes';
import { AllNodeType } from 'Model/Library';

type Props = {
    portLabel: string;
    index: number;
    nodes: any[];
    selectedStep: any;
    updateStep: (step: AllNodeType) => void;
    disabled: boolean;
};

/**
 * 入力ポートコネクタ
 * @param props 
 * @returns 
 */
export const InConnector = (props: Props) => {
    const {portLabel, index, nodes, selectedStep, updateStep, disabled} = props;

    const nodeId = selectedStep.srcs[portLabel];

    const dataSourceOptions = FlowUtil.getAllDataFrame(nodes).map(dataFrame => ({
        value: dataFrame.id,
        label: dataFrame.label || '',
        object: dataFrame
    }));

    const onChangeInEdge = (e, data, label) => {
        let newSelectedStep = StateUtil.deepCopy(selectedStep);
        //labelにポート名
        //data.objectにデータフレームが格納されている
        if (data.object) {
            //ノードが選択されたとき
            const dataSource: FrameNodeType = data.object;
            newSelectedStep.srcs[label] = dataSource.id;
            updateStep(newSelectedStep);
        } else {
            //「選択してください」が選択されたときはノードのつながりを削除する
            newSelectedStep.srcs[label] = null;
            updateStep(newSelectedStep);
        }
    };

    const deletePort = (step:CommandNodeType, portLabel:string) => {
        // FIXME:
        // dispatch(updateStepAction(step, zoom)) の処理ではStateと入力Nodeのsrcsに差異がある場合に限りCanvasのエッジ描画に反映させる
        // そのため、Stateが参照するNodeではなくこれを複製して、iPortを削除したものを渡す必要がある
        // 複製したNodeのdeleteinPort関数は複製元のiPortを削除するので、複製したNodeのinPortを削除するためのdeleteInPort関数を用意する
        const deleteInPort = (step:CommandNodeType, label:string) => {
            step.srcs && delete step.srcs[label];
            if(step.srcsOrder){
                step.srcsOrder = step.srcsOrder.filter(srcLabel => srcLabel !== label);
            }
        };

        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                // const newStep:CommandNodeType = StateUtil.deepCopy(step);
                const newStep:CommandNodeType = {...step, srcs:{...step.srcs}, srcsOrder:[...(step.srcsOrder || [])]};
                deleteInPort(newStep, portLabel);
                updateStep(newStep);
                ModalUtil.closeModal(Constants.modal.CONFIRM);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: '削除する',
            danger: true,
            content: <div>
                {portLabel} の入力を削除しますか？
            </div>
        });
    };

    const actionProps = selectedStep.addableInPort() ? {
        actionLabel: '削除',
        onClickAction: () => deletePort(selectedStep, portLabel)
    }: null;

    return <li>
        <div key={index} className={style.param}>
            <DropDownList
                key={'in_edge'}
                label={portLabel}
                list={dataSourceOptions}
                defaultValue={nodeId}
                hiddenNoSelect={false}
                disabled={disabled}
                onChange={(e, data, label) => onChangeInEdge(e, data, label)}
                {...actionProps}
            />
        </div>
    </li>;
};
