import React, {useEffect} from "react";
import Constants from "Constants/index";
import {FlowUtil, ModalUtil, ReactDomUtil} from "Utils/index";
import style from "../style.scss";
import {Button} from "Shared/Input";
import {BaseInspector, InputFlowForm, Resizer} from "Shared/Inspector";
import {RunArgsType, RunResponseType} from "Types/index";
import moment from "moment/moment";
import {FlowModelProps} from "Model/Flow/FlowModel";

type Props = {
    onClickDelete: Function;
    onClickDuplicate: Function;
    onBlurTitle: Function;
    runArgs: RunArgsType;
    updateRunArgs: Function;
    flow: FlowModelProps;
    notify: Function;
    dismissNotify: Function;
}

const FlowInspector = (props: Props) => {

    useEffect(() => {
        ModalUtil.registerModal({
            id: Constants.modal.RUN_FLOW, onClickDone: () => {
                run();
                //モーダルを閉じる
                ModalUtil.closeModal(Constants.modal.RUN_FLOW);
            }
        });
    }, []);

    const nullInspector = () => {
        return <Resizer>
            <BaseInspector />
        </Resizer>;
    };

    const resetRunArgsValue = () => {
        const {runArgs, updateRunArgs} = props;
        runArgs.flows = runArgs.flows.map((f) => {
            f.uuid = null;
            return f;
        });
        runArgs.variables = runArgs.variables.map((v) => {
            v.value = null;
            return v;
        });

        updateRunArgs(runArgs);
    };

    const onClickRun = () => {

        const {runArgs, updateRunArgs, flow} = props;
        resetRunArgsValue();

        let content = <InputFlowForm runArgs={runArgs} updateRunArgs={updateRunArgs} flow={flow} />;

        ModalUtil.emitModal({
            id: Constants.modal.RUN_FLOW,
            visible: true,
            done: "実行する",
            cancle: "キャンセル",
            dynamic: true,
            danger: false,
            content: content
        });
    };

    const run = () => {
        const {runArgs, notify, dismissNotify} = props;
        //TODO RunArgsのValidate

        FlowUtil.runWithArgs(runArgs, notify, dismissNotify).then((response) => {
            resetRunArgsValue();
            if (response.data.success) {
                const json: RunResponseType = response.data;
                const result = json.lasts.map((n, index) => {
                    return <li key={index}>{n.id}</li>;
                });
                const content = <div>
                    <div>ライブラリにフローの実行結果が追加されました。</div>
                    <ul>{result}</ul>
                </div>;

                notify({
                    title: "フロー実行完了",
                    message: ReactDomUtil.renderToString(content),
                    status: "success",
                    dismissAfter: 0,
                    buttons: [
                        {
                            name: "開く",
                            primary: true,
                            onClick: () => {
                                window.open("/library");
                            }
                        }]
                });
            }
        });
    };

    const {onClickDuplicate, onClickDelete, onBlurTitle} = props;
    const {flow}: { flow: FlowModelProps } = props;
    if (!flow) {
        return nullInspector();
    }
    const uuid = flow.uuid;
    const label = flow.label;
    const creator = flow.creator;
    const createdAt = flow.createdAt;
    const description = flow.description;
    const content = <div>
        <div className={style.actions}>
            <Button onClick={() => onClickRun()}>実行する</Button>
            <Button onClick={() => onClickDuplicate(uuid)}>複製する</Button>
            <Button danger={true}
                    onClick={() => onClickDelete(uuid)}>削除する</Button>
        </div>
        <div className={style.full_hr} />
        <div>
            <label>フロー名</label>
        </div>
        <div>
            {label}
        </div>
        <div>
            <label>説明</label>
        </div>
        <div>
            {(description) ? description : "説明がありません"}
        </div>
        <div>
            <label>作成者</label>
        </div>
        <div>
            {creator}
        </div>
        <div>
            <label>作成日時</label>
        </div>
        <div>
            {moment(createdAt).format(Constants.format.dateTime)}
        </div>
    </div>;

    return <Resizer>
        <BaseInspector key={uuid + "_" + label} label={label} onBlurTitle={(e) => onBlurTitle(e, flow)}>
            {content}
        </BaseInspector>
    </Resizer>;

};

export {FlowInspector};
