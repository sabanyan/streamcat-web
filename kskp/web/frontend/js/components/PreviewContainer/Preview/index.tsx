import React, {useEffect, useState} from "react";
import Constants from "Constants/index";

import {APIUtil, APIUtil2, HttpUtil, ModalUtil, SortUtil, StringUtil} from "Utils/index";
import {VisualizeModel, VisualizeModelProps} from "Model/index";
import {ModalManager} from "Shared/Modal";
import Loader from "Shared/Base/Loader";
import {NotificationManager} from "Shared/Notification";
import {useDispatch} from "react-redux";
import {addNotification, removeNotification} from "reapop";

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

const Preview = () => {

    const dispatch = useDispatch();
    const notify = (context) => dispatch(addNotification(context));
    const dismissNotify = (id: string) => {
        setTimeout(() => {
            dispatch(removeNotification(id));
        }, 1000);
    };

    const parentProps = {
        dispatch,notify,dismissNotify
    };

    const [isLoading, setIsLoading] = useState(false);
    const [visualizers, setVisualizers] = useState<VisualizeModel<VisualizeModelProps>[]>([]);

    const getVisualizers = () => {
        APIUtil2.findVisualizers().then(visualizers => {
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
            const frame_uuid = HttpUtil.getURLParam("frame_uuid");
            if (frame_uuid) {
                // データが存在している場合（ライブラリ）
                content = {title: v.label, content: viz, parentProps: parentProps, id: frame_uuid};
                viz["frame_uuid"] = frame_uuid;
            } else {
                // データが存在しなくて生成する必要あり（フローエディターからのプレビュー）
                const frame_id = HttpUtil.getURLParam("step_id");
                const flow_uuid = HttpUtil.getURLParam("flow_uuid");
                const lock_uuid = HttpUtil.getURLParam("lock_uuid");
                let step_ids = JSON.parse(StringUtil.urlDecode((HttpUtil.getURLParam("step_ids"))));
                content = {title: v.label, content: viz, parentProps: parentProps, id: frame_id};
                viz["frame_uuid"] = frame_uuid;
                viz["flow_uuid"] = flow_uuid;
                viz["lock_uuid"] = lock_uuid;
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
        <ModalManager
            notify={notify}
            dismissNotify={dismissNotify}
        />
        <NotificationManager />
    </div>;
};

export {Preview};
