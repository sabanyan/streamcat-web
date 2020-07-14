import React, {useState} from "react";
import Constants from "Constants/index";
import {FlowEditorProps} from "FlowEditorContainer/index";
import inspectorStyle from "../style.scss";
import style from "Shared/Visualizer/DataPreview/style.scss";
import {DownloadButton} from "Shared/Input";
import {BaseInspector} from "Shared/Inspector";

interface Props extends FlowEditorProps {
    onChange: Function;
    title: string;
    chart_instance: any;
}

type State = {
    image_url?: string;
    type?: string;
}

const DataPreviewInspector = (props: Props) => {

    const [image_url, setImageUrl] = useState<string>("");
    const [type, setType] = useState<string>("");


    const onChangeChart = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const {onChange} = props;
        const type = e.target.value;
        setType(type);
        onChange(type);
    };


    const onClickSave = () => {
        const {chart_instance} = props;
        let url_base64 = chart_instance.toBase64Image();
        setImageUrl(url_base64);
    };


    const {title} = props;
    const content = <div>
        <div className={style.actions}>
            <DownloadButton download="image.png" href={image_url}
                            onClick={() => onClickSave()}>チャートグラフの保存</DownloadButton>
        </div>
        <div className={inspectorStyle.full_hr} />
        <div className="kskp-form">
            <div>
                <label>グラフの種類</label>
            </div>
            <div>
                <select className="form-control" onChange={(e) => onChangeChart(e)}
                        defaultValue={Constants.chart.bar}>
                    <option value={Constants.chart.bar}>縦棒グラフ</option>
                    <option value={Constants.chart.horizontalBar}>横棒グラフ</option>
                    {/*<option value={Constants.chart.doughnut}>ドーナツチャート</option>*/}
                    {/*<option value={Constants.chart.line}>折れ線グラフ</option>*/}
                    <option value={Constants.chart.pie}>パイチャート</option>
                    {/*<option value={Constants.chart.polar}>ポーラチャート</option>*/}
                    <option value={Constants.chart.radar}>レーダーチャート</option>
                    {/*<option value={Constants.chart.bubble}>バブルチャート</option>*/}
                    <option value={Constants.chart.scatter}>散布図</option>
                </select>
            </div>
        </div>
    </div>;

    return <BaseInspector header={""} label={title}>
        {content}
    </BaseInspector>;
};

export {DataPreviewInspector};
