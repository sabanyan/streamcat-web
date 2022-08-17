import React from "react"
import { DatumType, FolderType, FrameType } from "Model/Library";
import { Drawer2, FixedField2, Select2, TextField2 } from "Shared/Input";
import { MoveButton } from "Shared/Button/MoveButton";
import { DeleteButton } from "Shared/Button/DeleteButton";
import { EditBox } from "Shared/Base/EditBox";
import { DownloadCsvButton } from "Shared/Button/DownloadCsvButton";
import StringUtil from "Utils/StringUtil";
import Constants from "Constants/index";
import { CreatorField } from "Shared/Input/CreatorField";

type Props = {
    createMode: boolean;
    parent: FolderType;
    frame: FrameType;
    onSuccess:(newFrame:FrameType) => void;
};

export const FrameDrawer = (props:Props) => {
    const { createMode, parent, frame, onSuccess } = props;

    // 初期表示値
    const initLabel = {value:createMode? '': frame.label, isError:createMode};
    const initEncoding = {value:createMode? 'UTF-8': frame.encoding, isError:false}
    const initNewline  = {value:createMode? 'LF': frame.newline, isError:false}

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);
    const [encoding, setEncoding] = React.useState(initEncoding);
    const [newline, setNewline]   = React.useState(initNewline);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
        setEncoding(initEncoding);
        setNewline(initNewline);
    };

    // フレームの新規追加処理
    const create = () => parent.createFrame(label.value, new File([], label.value));

    // フレームの更新処理
    const update = () => {
        let promises:Promise<DatumType>[] = [];
        // ラベル名が変更された場合はPromiseを追加する
        if(label.value!==frame.label){
            promises.push(
                frame.rename(label.value)
            );
        }
        // 文字コード、または改行コードが変更された場合はPromiseを追加する
        if(encoding.value!==frame.encoding || newline.value!==frame.newline){
            promises.push(
                frame.update(encoding.value, newline.value)
            );
        }
        // 全ての更新処理が完了したら、Projectを返すPromiseを返す
        return Promise.all(promises).then(data => data[0]);
    };

    // ファイルサイズを単位表記に変換する
    const ConvToFileSizeStr = (fileSize:number) => StringUtil.convertToFileSize(fileSize);

    // 全ての文字コード
    const encodingItems = Constants.encodings.map(encoding => ({
        label: encoding,
        value: encoding
    }));

    // 全ての改行コード
    const newlineItems = Constants.newlines.map(newline => ({
        label: newline,
        value: newline
    }));

    return <Drawer2>
        <EditBox // 編集ロック=ONの場合は編集不可
                 createMode={createMode}
                 datum={frame}
                 values = {[label]}
                 initValues={initValues}
                 create={create}
                 update={update}
                 onSuccess={datum=>onSuccess(datum as FrameType)} >{[
            // ボタン
            [
                <MoveButton key='move'
                            parent={parent} 
                            targets={[frame]}
                            onSuccess={(data)=>onSuccess(data[0] as FrameType)} />,
                <DeleteButton key='del'
                              targets={[frame]}
                              onSuccess={(data)=>onSuccess(data[0] as FrameType)} />,
                <DownloadCsvButton  key='download'
                                    targets={[frame]} />
            ],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyPress) => [
                <TextField2 key='label'
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <FixedField2 key='size'
                             label='ファイルサイズ'
                             value={ConvToFileSizeStr(frame.fileSize)} />,
                <Select2    key='encoding'
                            label='文字コード'
                            required={true}
                            items={encodingItems}
                            readOnly={readOnly}
                            state={[encoding, setEncoding]}
                            onErrorChange={onErrorChange} />,
                <Select2    key='newline'
                            label='改行コード'
                            required={true}
                            items={newlineItems}
                            readOnly={readOnly}
                            state={[newline, setNewline]}
                            onErrorChange={onErrorChange} />,
                <CreatorField key='creator' datum={frame} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
