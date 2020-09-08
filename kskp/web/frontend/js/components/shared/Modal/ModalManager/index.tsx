//@flow
import React from "react";
import Constants from "Constants/index";
import {Modal} from "Shared/Modal";

/**
 *
 * 全てのモーダルはここで管理します
 *
 * モーダルの呼び出し位置でモーダルを表示した場合、
 * 不具合が生じやすいため分離した構成になっています
 *
 * モーダルとコンポーネント間はEventEmitterで通信できるようになっています
 *
 * モーダルウインドウを表示する場合
 *
 * Modal <---- EventEmitter ----> Component
 * Listen                          emit!!
 *
 * モーダルウインドウ内のボタンが押された場合
 *
 * Modal <----- EventEmitter ----> Component
 * emit!!                           listen
 *
 * ボタンが押された場合の処理は、ModalUtil.registerで
 * コールバック処理を受け取れます
 *
 */

interface Props {
    notify?: any;
    dismissNotify?: any;
}

export default class ModalManager extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    componentDidUpdate() {
        (window as any).modalRefs = this.refs;
    }

    render() {
        const {notify, dismissNotify} = this.props;

        return <div>
            <Modal key={Constants.modal.ADD_COMMAND}
                   id={Constants.modal.ADD_COMMAND} dynamic={true}>
            </Modal>
            <Modal key={Constants.modal.IMPORT_DATASOURCE}
                   id={Constants.modal.IMPORT_DATASOURCE} dynamic={true}
                   done={"追加する"}>
            </Modal>
            <Modal key={Constants.modal.PREVIEW_DATASOURCE}
                   id={Constants.modal.PREVIEW_DATASOURCE} dynamic={true}
                   preview={true} footer={false}
                   notify={notify}
                   dismissNotify={dismissNotify}>
            </Modal>
            <Modal key={Constants.modal.SHOW_MESSAGE}
                   id={Constants.modal.SHOW_MESSAGE} title="" dynamic={true}
                   ok={true}>
                <div ref={Constants.modal.SHOW_MESSAGE} />
            </Modal>
            <Modal key={Constants.modal.CONFIRM}
                   id={Constants.modal.CONFIRM} title="" dynamic={true}>
                <div ref={Constants.modal.CONFIRM} />
            </Modal>
            <Modal key={Constants.modal.ADD_PROJECT} id={Constants.modal.ADD_PROJECT}
                   title="プロジェクトの新規作成" dynamic={true} done={"作成する"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.ADD_FLOW} id={Constants.modal.ADD_FLOW}
                   title="フローの新規作成" dynamic={true} done={"作成する"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.ADD_FOLDER} id={Constants.modal.ADD_FOLDER}
                   title="フォルダの作成" dynamic={true} done={"作成する"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.ADD_DATABASE} id={Constants.modal.ADD_DATABASE}
                   title="新しいデータベースを追加" dynamic={true} done={"追加する"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.EDIT_DATABASE} id={Constants.modal.EDIT_DATABASE}
                   title="データベースを設定" dynamic={true} done={"設定する"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.EDIT_ENCODING} id={Constants.modal.EDIT_ENCODING}
                   title="文字コードを編集" dynamic={true} done={"編集する"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.ADD_DOCUMENT} id={Constants.modal.ADD_DOCUMENT}
                   title="資料をアップロード" dynamic={true} done={"追加する"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.ADD_FRAME} id={Constants.modal.ADD_FRAME}
                   title="CSVをアップロード" dynamic={true} done={"追加する"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.SHOW_RUN_RESULT} id={Constants.modal.SHOW_RUN_RESULT}
                   title="実行完了" dynamic={true} cancel={"OK"} done={"ライブラリを開く"} primary={true}>
            </Modal>
            <Modal key={Constants.modal.SHOW_RUN_ERROR} id={Constants.modal.SHOW_RUN_ERROR}
                   title="実行エラー" dynamic={true} ok={true}>
            </Modal>
            <Modal key={Constants.modal.RUN_FLOW} id={Constants.modal.RUN_FLOW}
                   title="選択されたフローを実行します" dynamic={true} footer={true}>
            </Modal>
            <Modal key={Constants.modal.ADD_USER} id={Constants.modal.ADD_USER}
                   title="ユーザーの新規作成" dynamic={true} footer={true}>
            </Modal>
        </div>;
    }
}
