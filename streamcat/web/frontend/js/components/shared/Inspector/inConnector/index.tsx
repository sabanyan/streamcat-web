import React from 'react';
import style from '../style.scss';
import Constants from 'Constants/index';
import {StepModelType} from 'Types/index';
import {DataFrameStepModel} from 'Model/index';
import {DropDownList} from 'Shared/Input';
import {FlowUtil, ModalUtil, StateUtil} from 'Utils/index';

type Props = {
    portLabel: string;
    index: number;
    nodes: any[];
    selectedStep: any;
    updateStep: Function;
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
        label: dataFrame.getLabel(),
        object: dataFrame
    }));

    const onChangeInEdge = (e, data, label) => {
        let newSelectedStep = StateUtil.deepCopy(selectedStep);
        //labelにポート名
        //data.objectにデータフレームが格納されている
        if (data.object) {
            //ノードが選択されたとき
            const dataSource: DataFrameStepModel = data.object;
            newSelectedStep.srcs[label] = dataSource.id;
            updateStep(newSelectedStep);
        } else {
            //「選択してください」が選択されたときはノードのつながりを削除する
            newSelectedStep.srcs[label] = null;
            updateStep(newSelectedStep);
        }
    };

    const deletePort = (step: StepModelType, portLabel: string) => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, onClickDone: () => {
                const newStep = StateUtil.deepCopy(step);
                newStep.deleteInPort(portLabel);
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
