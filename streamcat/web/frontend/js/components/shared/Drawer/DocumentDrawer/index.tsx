import React from "react"
import { Box } from "@mui/material";
import StringUtil from "Utils/StringUtil";
import { FolderType, DocumentType } from "Model/Library";
import { Drawer2, FixedField2 } from "Shared/Input";
import { MoveButton } from "Shared/Button/MoveButton";
import { DuplicateButton } from 'Shared/Button/DuplicateButton';
import { DeleteButton } from "Shared/Button/DeleteButton";
import { CreatorField } from "Shared/Input/CreatorField";

type Props = {
    parent: FolderType;
    document: DocumentType;
    onSuccess: (data:DocumentType[]) => void;
};

export const DocumentDrawer = (props:Props) => {
    const { parent, document, onSuccess } = props;

    // ファイルサイズを単位表記に変換する
    const ConvToFileSizeStr = (fileSize:number) => StringUtil.convertToFileSize(fileSize);

    return <Drawer2>
        <Box>
            <MoveButton key='move'
                        parent={parent}
                        targets={[document]}
                        onSuccess={data => onSuccess(data as DocumentType[])} />
            <DuplicateButton key='duplicate'
                             targets={[document]}
                             onSuccess={(data)=>onSuccess(data as DocumentType[])} />
            <DeleteButton key='del'
                          targets={[document]}
                          onSuccess={data => onSuccess(data as DocumentType[])} />
        </Box>
        <FixedField2 key='label'
                     label='ラベル'
                     value={document.label} />
        <FixedField2 key='size'
                     label='ファイルサイズ'
                     value={ConvToFileSizeStr(document.fileSize)} />
        <CreatorField key='creator' datum={document} />
    </Drawer2>;
};
