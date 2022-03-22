import React, {useEffect, useState} from "react";
import Constants from "Constants/index";
import {APIUtil2, HttpUtil, ModalUtil, SortUtil, StringUtil} from "Utils/index";
import {VisualizeModel, VisualizeModelProps} from "Model/index";
import {ModalManager} from "Shared/Modal";
import Loader from "Shared/Base/Loader";
import {NotificationManager} from "Shared/Notification";

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

const Preview = () => {

    const [isLoading, setIsLoading] = useState(false);
    const [visualizers, setVisualizers] = useState<VisualizeModel<VisualizeModelProps>[]>([]);

    const getVisualizers = () => {
        APIUtil2.findVCommands().then(visualizers => {
            const visualizerModels = visualizers.map(visualizer => new VisualizeModel(visualizer));
            setVisualizers(SortUtil.getSortedContents(visualizerModels));
            window.visualizers = visualizerModels;
        });
    }

    useEffect(() => {
        getVisualizers();
    }, []);

    useEffect(() => {
        if(!visualizers.length)return;
        // vizs
        setIsLoading(false);
        let contents: any[] = [];
        for (const v of visualizers) {
            let content: any;
            const viz = {visualize: v};
            const frameUuid = HttpUtil.getURLParam("frame_uuid");
            if (frameUuid) {
                // データが存在している場合（ライブラリ）
                content = {title: v.label, content: viz, id: frameUuid};
                viz["frameUuid"] = frameUuid;
            } else {
                // データが存在しなくて生成する必要あり（フローエディターからのプレビュー）
                const frame_id = HttpUtil.getURLParam("step_id");
                const flowUuid = HttpUtil.getURLParam("flow_uuid");
                const lockUuid = HttpUtil.getURLParam("lock_uuid");
                let step_ids = JSON.parse(StringUtil.urlDecode((HttpUtil.getURLParam("step_ids"))));
                content = {title: v.label, content: viz, id: frame_id};
                viz["frameUuid"] = frameUuid;
                viz["flowUuid"] = flowUuid;
                viz["lockUuid"] = lockUuid;
                viz["stepIds"] = step_ids;
            }
            contents.push(content);
        }
        const title = StringUtil.urlDecode(HttpUtil.getURLParam("title"));

        // HTML headのtitleを設定する
        // アイコンの候補: 👁‍🗨👁
        document.title = "👁‍🗨" + title;

        ModalUtil.emitModal({
            id: Constants.modal.PREVIEW_DATASOURCE,
            visible: true,
            contents: contents,
            title: title
        });
    }, [visualizers]);

    return <div className={"container mt-40px"}>
        <Loader center={true} absolute={true} visible={isLoading} />
        <ModalManager />
        <NotificationManager />
    </div>;
};

export {Preview};
