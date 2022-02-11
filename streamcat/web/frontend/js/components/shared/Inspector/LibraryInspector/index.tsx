import React, {useEffect} from 'react';
import style from '../style.scss';
import {BaseInspector, Resizer} from 'Shared/Inspector';
import {LibraryListDataType} from 'Types/index';
import moment from 'moment/moment';
import Constants from 'Constants/index';
import {Button, DownloadButton} from 'Shared/Input';
import {APIUtil2, ModalUtil, StringUtil} from "Utils/index";
import {DatumType, FlowType, FrameType, ParentProjectType, ProjectType} from 'Model/Library';

type Props = {
    projectsReader: () => ProjectType[] | null;
    selectedData: DatumType;
    onClickDelete?: Function;
    onClickApply?: Function;
    onClickMove?: Function;
    onBlurTitle?: ((e:any, selectedData: DatumType) => void) | null;
    onClickEdit?: Function;
    onClickEditEncoding?: Function;
    onChangEditLock?: Function;
    onClickCleanTrash?: Function;
    onClickMemberInfo?: (project:ParentProjectType) => void;
    onClickCopy?: Function;
}

const LibraryInspector = (props: Props) => {
    const display = {
        label: '名称',
        encoding: '文字コード',
        newline: '改行コード',
        creator: '作成者',
        createdAt: '作成日時',
        prevFolderPath: '捨てる前の場所',
        fileSize: 'ファイルサイズ'
    };

    useEffect(() => {
        //モーダル処理の登録
        ModalUtil.registerModal({
            id: Constants.modal.PREVIEW_DATASOURCE,
            onClickOK: () => {
                ModalUtil.closeModal(Constants.modal.PREVIEW_DATASOURCE);
            }
        });
    }, []);

    const onClickPreview = () => {
        // dataがない（Null)の場合はPreviwボタンは表示しない（render)
        let {selectedData} = props;
        let library: LibraryListDataType = selectedData;
        let uuid = library.uuid;
        // uuidだけでプレビュー
        window.open('/preview?step_id=' + null + '&dialog=true&frame_uuid=' + uuid + '&title=' + StringUtil.urlEncode(library.label));
    };

    const renderButtons = (data: DatumType) => {
        const { selectedData, onClickDelete, onClickApply, onClickMove, onClickEdit,
                onClickEditEncoding, onClickCleanTrash, onChangEditLock, onClickCopy} = props;

        let preview, download, del, apply, move, edit, editEncoding, trashClean, lock, copy, flowExport;

        // preview button
        if (data.allowlist.read && data && data.label && data.type === Constants.library.type.frame) {
            preview = <Button onClick={() => onClickPreview()} icon={"visibility"}>プレビューする</Button>;
        }

        // download button
        if (data.allowlist.download && data && data.label && data.type === Constants.library.type.frame) {
            const onClick = () => APIUtil2.downloadFrame(data.uuid, data.label);
            download = <DownloadButton onClick={onClick} download icon={"get_app"}>CSVをダウンロードする</DownloadButton>;
        }

        // edit
        if (data.allowlist.update && onClickEdit) {
            edit = <Button onClick={() => onClickEdit(selectedData)} icon={"settings"}>設定を開く</Button>;
        }

        // apply button
        if (onClickApply) apply = <Button primary={true} onClick={() => onClickApply(data)}>選択する</Button>;

        // editEncoding
        if (data.allowlist.update && onClickEditEncoding && data && data.type === Constants.library.type.frame) {
            editEncoding = <Button onClick={() => onClickEditEncoding(data)} icon={'edit'}>文字コードを編集する</Button>;
        }

        // clean trash button
        if (data.allowlist.delete && onClickCleanTrash)
            trashClean = <Button onClick={(data) => onClickCleanTrash(data)} danger={true} icon={"delete"}>ゴミ箱を空にする</Button>;

        // flow lock button
        if (data.allowlist.lock && data && data.type == Constants.library.type.flow && onChangEditLock) {
            const flow = data as FlowType;
            lock = <div className={style.flowLock}>
                <input id="flowLock" type="checkbox" checked={flow.editLock ? true : false} onChange={(e) => onChangEditLock(e, flow)}></input>
                <label htmlFor="flowLock">編集ロック</label>
            </div>;
        }

        // delete button
        if (data.allowlist.delete && onClickDelete)
            del = <Button danger={true} onClick={() => onClickDelete(data)} icon={"delete"}>削除する</Button>;

        // move button
        if (data.allowlist.move && onClickMove)
            move = <Button onClick={(data) => onClickMove(data)} icon={"open_in_browser"}>移動する</Button>;

        if (onClickCleanTrash) {
            // ゴミ箱の場合、削除と移動を非表示にする
            del = null;
            move = null;
        }

        if (data.allowlist.copy && data && data.type == Constants.library.type.flow && onClickCopy) {
            copy = <Button onClick={(e) => onClickCopy(e, data)} icon={"content_copy"}>複製する</Button>;
        }

        if (data.allowlist.export && data && (data.type == Constants.library.type.flow || Constants.library.type.folder || Constants.library.type.project)) {
            const onClick = () => APIUtil2.downloadFlow(data.uuid, data.label);
            download = <DownloadButton onClick={onClick} download icon={"get_app"}>フローをダウンロードする</DownloadButton>;
        }

        return <React.Fragment>
            {preview}
            {download}
            {edit}
            {move}
            {copy}
            {apply}
            {editEncoding}
            {del}
            {trashClean}
            {flowExport}
            {lock}
        </React.Fragment>;
    };

    const renderDetail = (data: DatumType) => {
        let result: JSX.Element[] = [];
        if (!data) return result;

        // ラベルがあれば、表示する
        let label;
        if (data.label) {
            label = <React.Fragment key={data.label}>
                <div><label>{display.label}</label></div>
                <div className={"mb-8px"}>{data.label}</div>
            </React.Fragment>;

            result.push(label);
        }

        if (data.type === Constants.library.type.frame) {
            const frame = data as FrameType;
            // ファイルサイズがあれば、表示する
            if (frame.fileSize !== undefined) {
                const fileSize = <React.Fragment key={frame.fileSize}>
                    <div><label>{display.fileSize}</label></div>
                    {frame.fileSize ? <div className={"mb-8px"}>{StringUtil.convertToFileSize(frame.fileSize)}</div> : 0}
                </React.Fragment>;
                result.push(fileSize);
            }

            // 文字コードがあれば、表示する
            if (frame.encoding) {
                const encoding = <React.Fragment key={frame.encoding}>
                    <div><label>{display.encoding}</label></div>
                    <div className={"mb-8px"}>{frame.encoding}</div>
                </React.Fragment>;
                result.push(encoding);
            }

            // 改行コードがあれば、表示する
            let newline;
            if (frame.newline) {
                newline = <React.Fragment key={frame.newline}>
                    <div><label>{display.newline}</label></div>
                    <div className={"mb-8px"}>{frame.newline}</div>
                </React.Fragment>;
                result.push(newline);
            }
        }


        // 作成者があれば、表示する
        let creator;
        if (data.creator) {
            creator = <React.Fragment key={data.creator}>
                <div><label>{display.creator}</label></div>
                <div className={"mb-8px"}>{data.creator}</div>
            </React.Fragment>;

            result.push(creator);
        }

        // 作成日時があれば、表示する
        let createdAt;
        if (data.createdAt) {
            createdAt = <React.Fragment key={data.createdAt}>
                <div><label>{display.createdAt}</label></div>
                <div className={"mb-8px"}>{moment(data.createdAt).format(Constants.format.dateTime)}</div>
            </React.Fragment>;

            result.push(createdAt);
        }

        // プロジェクトメンバとメンバ編集ボタンを表示する
        if (data && data.type == "project") {
            const {projectsReader} = props;
            // ルートフォルダにある全てのプロジェクトを取得する
            const projects = projectsReader();
            if(projects){
                // 選択中のプロジェクトを取得する
                const project = projects.find(child => child.uuid === data.uuid);
                if(project){
                    const projectInfo = renderProjectInfo(project as ParentProjectType);
                    result.push(projectInfo || <></>);
                }
            }
        }

        return <React.Fragment>
            {result}
        </React.Fragment>;
    };

    const renderSelect = (data: DatumType) => {
        return <div className={style.inspector}>
            <div className={style.actions}>
                {renderButtons(data)}
            </div>
            <div className={style.full_hr} />
            <div className={style.detail}>
                {renderDetail(data)}
            </div>
        </div>;
    };

    const memberTypeToRoleName = (type: string) => {
        let result: string;

        switch (type) {
            case 'Reader':
                result = Constants.projectMemberRole.READER;
                break;
            case 'Writer':
                result = Constants.projectMemberRole.WRITER;
                break;
            case 'Owner':
                result = Constants.projectMemberRole.OWNER;
                break;
            default:
                result = "unknown";
                break;
        }

        return result;
    };

    /**
     * プロジェクトメンバ一覧とメンバ編集ボタンを表示する
     */
    const renderProjectInfo = (project: ParentProjectType) => {
        const {onClickMemberInfo} = props;
        if (!onClickMemberInfo) return null;
        const members = project.members;
        const memberCount = members ? members.length : 0;
        let membersForm: any = null;
        if (members) {
            membersForm = members.map((member) => {
                return <div key={member.email}>{member.name + "(" + memberTypeToRoleName(member.type) + ")"}</div>;
            });
        }

        return <React.Fragment key={"project-info"}>
            <div className={style.full_hr} />
            <label>{"このプロジェクトのメンバー(" + memberCount + ")"}</label>
            {
                (project.allowlist && project.allowlist.updateMember && onClickMemberInfo) ?
                <Button onClick={(e) => onClickMemberInfo(project)} icon={"people"}>
                    メンバーを編集する
                </Button>
                : null
            }
            <div className={style.memberList}>
                {project.allowlist && project.allowlist.findMember && members ? membersForm : null}
            </div>
        </React.Fragment>;
    };

    const {selectedData, onBlurTitle} = props;
    if (!selectedData) return <></>;

    const enabled = selectedData.allowlist && selectedData.allowlist.update;
    return <Resizer>
        <BaseInspector key={selectedData.uuid}
                       label={selectedData.label}
                       onBlurTitle={onBlurTitle ? (e) => onBlurTitle(e, selectedData) : null}
                       disabled={!enabled}>
            {renderSelect(selectedData)}
        </BaseInspector>
    </Resizer>;

}

export {LibraryInspector};
