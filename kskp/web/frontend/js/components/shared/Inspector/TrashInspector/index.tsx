import * as React from "react";

import style from "../style.scss";

import { BaseInspector, Resizer } from "Shared/Inspector";
import { Button } from "Shared/Input";
import { DatumType, FrameType } from "Model/index";
import { Allowlist } from 'Components/LibraryContainer/Libary/index';


type Props = {
    data?: DatumType
    customStyle?: any
    allowlist?: Allowlist
    onClickRecovery: Function
    onClickMove: Function
}

type State = {}

export default class TrashInspector extends React.Component<Props, State> {
    display = {
        label: "名称",
        encoding: "文字コード",
        newline: "改行コード",
        creator: "作成者",
        createdAt: "作成日時",
        prevFolderPath: "捨てる前の場所"
    };

    constructor(props: Props) {
        super(props);
    }

    renderButtons(data) {
        const { onClickRecovery, onClickMove, allowlist } = this.props;

        let recovery, move;
        if (data && allowlist && allowlist.update) {
            recovery = <Button onClick={(e) => onClickRecovery(e, data)} icon={"undo"}>元に戻す</Button>;
            move = <Button onClick={(e) => onClickMove(e, data)} icon={"arrow_right_alt"}>移動する</Button>;
        }

        return <React.Fragment>
            {recovery}
            {move}
        </React.Fragment>;
    }

    renderDetail() {
        const { data } = this.props;
        let result: any = [];
        if (!data) return result;

        // ラベルがあれば、表示する
        let label;
        if (data.label) {
            label = <React.Fragment key={data.label}>
                <div><label>{this.display.label}</label></div>
                <div className={"mb-8px"}>{data.label}</div>
            </React.Fragment>;

            result.push(label);
        }

        // DatumがFrameの場合は文字コードと改行コードを表示する
        if(data.type==='frame'){
            const frame = data as FrameType;
            // 文字コードがあれば、表示する
            let encoding;
            if (frame.encoding) {
                encoding = <React.Fragment key={frame.encoding}>
                    <div><label>{this.display.encoding}</label></div>
                    <div className={"mb-8px"}>{frame.encoding}</div>
                </React.Fragment>;

                result.push(encoding);
            }

            // 改行コードがあれば、表示する
            let newline;
            if (frame.newline) {
                newline = <React.Fragment key={frame.newline}>
                    <div><label>{this.display.newline}</label></div>
                    <div className={"mb-8px"}>{frame.newline}</div>
                </React.Fragment>;

                result.push(newline);
            }
        }

        // 作成者があれば、表示する
        let creator;
        if (data.creator) {
            creator = <React.Fragment key={data.creator}>
                <div><label>{this.display.creator}</label></div>
                <div className={"mb-8px"}>{data.creator}</div>
            </React.Fragment>;

            result.push(creator);
        }

        // 作成日時があれば、表示する
        let createdAt;
        if (data.createdAt) {
            createdAt = <React.Fragment key={data.createdAt}>
                <div><label>{this.display.createdAt}</label></div>
                <div className={"mb-8px"}>{data.createdAt}</div>
            </React.Fragment>;

            result.push(createdAt);
        }

        let prevFolderPath;
        if (data.prevFolderPath) {
            prevFolderPath = <React.Fragment key={data.prevFolderPath}>
                <div><label>{this.display.prevFolderPath}</label></div>
                <div className={"mb-8px"}>{data.prevFolderPath}</div>
            </React.Fragment>;
            result.push(prevFolderPath);
        } else {
            // TODO ライブラリのルートの場合でない？
        }

        return <React.Fragment>
            {result}
        </React.Fragment>;
    }

    render() {
        const { data, customStyle } = this.props;

        const className = (customStyle) ? customStyle : style;

        return <Resizer>
            <BaseInspector key={(data) ? data.uuid : "trash"} disabled={false}>
                <div className={style.inspector}>
                    <div className={style.actions}>
                        {this.renderButtons(data)}
                    </div>
                    <div className={style.detail}>
                        {this.renderDetail()}
                    </div>
                </div>
            </BaseInspector>
        </Resizer>;
    }
}
