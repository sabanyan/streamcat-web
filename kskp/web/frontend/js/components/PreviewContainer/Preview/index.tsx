import React, {useEffect, useState} from "react";
import Constants from "Constants/index";

import {APIUtil, HttpUtil, ModalUtil, SortUtil, StringUtil} from "Utils/index";
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
interface Props {
    
}

const Preview = (_: Props) => {

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
        setIsLoading(true);
        APIUtil.get("visualizers").then((response) => {
            const json = response.data;
            let visualizers = json.data.map((visualize) => {
                return new VisualizeModel(visualize);
            });
            setVisualizers(SortUtil.getSortedContents(visualizers));
            window.visualizers = visualizers;
        }).then((response) => {
            },
            (error) => {
                console.log(error);
            });
    };

    useEffect(() => {
        getVisualizers();
    }, []);

    useEffect(() => {
        if(!visualizers.length)return;
        // vizs
        setIsLoading(false);
        let contents: any[] = [];
        for (const v of visualizers) {
            let viz = {visualize: v};
            let content: any;
            let frame_uuid = HttpUtil.getURLParam("frame_uuid");
            if (frame_uuid) {
                // データが存在している場合（ライブラリ）
                content = {title: v.label, content: viz, parentProps: parentProps, id: frame_uuid};
                viz["frame_uuid"] = frame_uuid;
            } else {
                // データが存在しなくて生成する必要あり（フローエディターからのプレビュー）
                let flow_uuid = HttpUtil.getURLParam("flow_uuid");
                let frame_id = HttpUtil.getURLParam("step_id");
                let step_ids = JSON.parse(StringUtil.urlDecode((HttpUtil.getURLParam("step_ids"))));
                content = {title: v.label, content: viz, parentProps: parentProps, id: frame_id};
                viz["frame_uuid"] = frame_uuid;
                viz["flow_uuid"] = flow_uuid;
                viz["stepIds"] = step_ids;
            }
            contents.push(content);
        }
        const title = StringUtil.urlDecode(HttpUtil.getURLParam("title"));

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
