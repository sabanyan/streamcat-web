import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';
import Constants from 'Constants/index';
import { FlowUtil, ModalUtil, ReactDomUtil } from 'Utils/index';
import { Api } from 'Api';
import { ActivityType, FlowType } from 'Model/Library';
import style from '../Core/style.scss';

type Props = {
    refreshFlow: Function;
    onClickRunFlowPromise: Function;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    notifyLoading: (title: string, message: string) => string;
    notifiWarning: (title: string, message: string) => string;
    notifyError: (title: string, message: string) => string;
    notifyComplete: Function;
    dismissNotify: Function;
    lockUUID?: string;
    children: React.ReactNode;
    disabled: boolean;
};

export const Run = (props: Props) => {
    const { refreshFlow,
            onClickRunFlowPromise,
            setIsLoading,
            notifyLoading,
            notifiWarning,
            notifyError,
            notifyComplete,
            dismissNotify,
            lockUUID,
            children,
            disabled} = props;

    const renderRunResult = (activity: ActivityType) => {
        const result = activity.outs.map(n => {
            return <li>{n.id}</li>;
        });
        const content = <div>
            <div>ライブラリにフローの実行結果が追加されました。</div>
            <ul>{result}</ul>
        </div>;
        return content;
    };

    const flowUpdate = () => {
        Api.findFlow(inject_flow_uuid).then(flow => {
            refreshFlow(flow);
        }).then(() => {
            setIsLoading(false);
        });
    };

    const run = () => {
        const runArgs = {
            'flowUuid': inject_flow_uuid,
            'lockUuid': lockUUID,
            'flows': [],
            'variables': []
        };
        return FlowUtil.runWithArgs(runArgs, notifyLoading, notifiWarning, notifyError, dismissNotify).then(activity => {
            const content = renderRunResult(activity);
            // TODO：将来、複数出力ごとにparentが異なる場合、仕様から要検討
            const parentFolderUUID = activity.outs[0].parent; //　今はlasts[0]
            // 結果出力
            notifyComplete('フロー実行完了', ReactDomUtil.renderToString(content), parentFolderUUID);
            // 実行後、各ノードのキャッシュ情報（キャッシュ作成日、uuid)を最新化するため
            flowUpdate();
        }).catch(e => {
            console.log(e);
        }).finally(() => {
            setIsLoading(false);
        });
    };

    const onClickProjectRun = () => {
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM_SAVE,
            onClickDone: () => {
                onClickRunFlowPromise().then((flow: FlowType) => {
                    // this.setState({
                    //     isLoading: true
                    // }, () => {
                    //     // フローを実行する
                    //     run();
                    // })
                    setIsLoading(true);
                    // フローを実行する
                    run();
                });
                ModalUtil.closeModal(Constants.modal.CONFIRM_SAVE);
            },
            onClickCancel: () => {
                ModalUtil.closeModal(Constants.modal.CONFIRM_SAVE);
            }
        });
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM_SAVE,
            visible: true,
            done: '確認',
            danger: true,
            content: <div className={style.modal}>
                <div>
                    現在のフローを保存します。<br />
                    よろしいですか？
                </div>
            </div>
        });
    };

    return <ToolBarButton onClick={(e) => onClickProjectRun()}
                          disabled={disabled}
                          icon='&#xE037'>{children}</ToolBarButton>;
};
