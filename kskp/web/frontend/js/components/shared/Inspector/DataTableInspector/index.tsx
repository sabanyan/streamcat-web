//@flow
import React from "react";
import style from "../style.scss";
import {DownloadButton} from "Shared/Input";
import {BaseInspector} from "Shared/Inspector";
import {HttpUtil, StringUtil} from "Utils/index";
import {CSVModel} from "Model/index";
import {CSVModelProps} from "Model/CSV/CSVModel";

type Props = {
    uuid: string,
    title: string,
    selected_data_source_detail: any,
    image_url: string,
}

const DataTableInspector = (props: Props) => {
    const onClickCSVDownload = () => {
        const {uuid} = props;
        const param = {
            type: "frame",
            uuid: uuid,
            ext: "csv"
        };
        HttpUtil.get("files", param).then((response) => {
            let props: CSVModelProps = {
                uuid: uuid,
                data: response.data
            };
            const csv: CSVModel = new CSVModel(props);
            csv.handleDownload();
        });
    };

    const {title, selected_data_source_detail, image_url} = props;
    const numberOfLines = StringUtil.separate(selected_data_source_detail.numberOfLines);
    const fileSize = StringUtil.convertToFileSize(selected_data_source_detail.fileSize);
    const lastModifiedAt = StringUtil.separate(selected_data_source_detail.lastModifiedAt);
    const content = <div>
        <div className={style.actions}>
            <DownloadButton download="image.png" href={image_url}
                            onClick={(e) => onClickCSVDownload()}>CSVダウンロード</DownloadButton>
        </div>
        <div className={style.full_hr} />
        <div className={style.overviews}>
            <div className={style.overview}>
                <div className={style.overview_label}>
                    データの件数
                </div>
                <div className={style.overview_value}>
                    {numberOfLines} {/*{property.overview.count || 0}*/}
                </div>
            </div>
            <div className={style.overview}>
                <div className={style.overview_label}>
                    ファイルサイズ
                </div>
                <div className={style.overview_value}>
                    {fileSize}
                </div>
            </div>
            <div className={style.overview}>
                <div className={style.overview_label}>
                    作成日時
                </div>
                <div className={style.overview_value}>
                    {lastModifiedAt} {/*{property.overview.created_at || ""}*/}
                </div>
            </div>
            <div className={style.overview}>
                <div className={style.overview_label}>
                    作成者
                </div>
                <div className={style.overview_value}>
                    {/*{property.overview.created_user_name || ""}*/}
                </div>
            </div>
        </div>
    </div>;

    return <BaseInspector header={""} label={title}>
        {content}
    </BaseInspector>;
};


export {DataTableInspector};
