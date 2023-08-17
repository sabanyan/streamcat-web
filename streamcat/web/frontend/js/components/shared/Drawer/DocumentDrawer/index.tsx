import React from 'react';
import StringUtil from 'Utils/StringUtil';
import { FolderType, DocumentType } from 'Model/Library';
import { EditBox } from 'Shared/Base/EditBox';
import { Drawer2, FixedField2, TextField2 } from 'Shared/Input';
import { MoveButton } from 'Shared/Button/MoveButton';
import { DuplicateButton } from 'Shared/Button/DuplicateButton';
import { DownloadFileButton } from 'Shared/Button/DownloadFileButton';
import { DeleteButton } from 'Shared/Button/DeleteButton';
import { CreatorField } from 'Shared/Input/CreatorField';

type Props = {
    createMode: boolean;
    parent: FolderType;
    document: DocumentType;
    onSuccess: (data:DocumentType) => void;
};

export const DocumentDrawer = (props:Props) => {
    const { createMode, parent, document, onSuccess } = props;

    // 初期表示値
    const initLabel = {value:createMode? '': document.label, isError:createMode};

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
    };

    // ドキュメントの新規追加処理
    const create = () => parent.createDocument(label.value, new File([], label.value));

    // ドキュメントの更新処理
    const update = () => document.rename(label.value);

    // ファイルサイズを単位表記に変換する
    const ConvToFileSizeStr = (fileSize:number) => StringUtil.convertToFileSize(fileSize);

    return <Drawer2>
        <EditBox // 編集ロック=ONの場合は編集不可
                 createMode={createMode}
                 datum={document}
                 values = {[label]}
                 initValues={initValues}
                 create={create}
                 update={update}
                 onSuccess={datum=>onSuccess(datum as DocumentType)} >{[
            // ボタン
            (readonly) => readonly? [
                <MoveButton key='move'
                            parent={parent}
                            targets={[document]}
                            onSuccess={data => onSuccess(data[0] as DocumentType)} />,
                <DuplicateButton key='duplicate'
                                targets={[document]}
                                onSuccess={(data)=>onSuccess(data[0] as DocumentType)} />,
                <DeleteButton key='del'
                            targets={[document]}
                            onSuccess={data => onSuccess(data[0] as DocumentType)} />,
                <DownloadFileButton key='download'
                                    targets={[document]} />
            ]: [],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyDown) => [
                <TextField2 key='label'
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyDown={onEnterKeyDown} />,
                <FixedField2 key='size'
                             label='ファイルサイズ'
                             value={ConvToFileSizeStr(document.fileSize)} />,
                <CreatorField key='creator' datum={document} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
